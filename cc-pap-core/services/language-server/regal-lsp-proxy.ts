/**
 * Regal LSP Proxy
 * 
 * This module proxies the official Regal language server, providing LSP
 * capabilities for Rego policy development in the Control Core platform.
 * 
 * Instead of implementing custom parsers and providers, this delegates
 * directly to Regal's battle-tested language server implementation.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface RegalLSPConfig {
  regalPath?: string;
  debug?: boolean;
  timeout?: number;
}

export interface LSPMessage {
  jsonrpc: string;
  id?: number | string;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

export class RegalLSPProxy extends EventEmitter {
  private regalProcess: ChildProcess | null = null;
  private regalPath: string;
  private debug: boolean;
  private timeout: number;
  private messageBuffer: string = '';
  private messageId: number = 1;

  constructor(config: RegalLSPConfig = {}) {
    super();
    this.regalPath = config.regalPath || 'regal';
    this.debug = config.debug || false;
    this.timeout = config.timeout || 30000; // 30 seconds
  }

  /**
   * Start the Regal language server process
   */
  async start(): Promise<void> {
    if (this.regalProcess) {
      throw new Error('Regal LSP is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        // Spawn Regal language server
        this.regalProcess = spawn(this.regalPath, ['language-server'], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (!this.regalProcess) {
          return reject(new Error('Failed to spawn Regal process'));
        }

        // Handle process errors
        this.regalProcess.on('error', (error) => {
          this.log('Process error:', error);
          this.emit('error', error);
          reject(error);
        });

        // Handle process exit
        this.regalProcess.on('exit', (code, signal) => {
          this.log(`Process exited with code ${code} and signal ${signal}`);
          this.regalProcess = null;
          this.emit('exit', { code, signal });
        });

        // Handle stderr
        this.regalProcess.stderr?.on('data', (data) => {
          const message = data.toString();
          this.log('STDERR:', message);
          this.emit('stderr', message);
        });

        // Handle stdout (LSP messages)
        this.regalProcess.stdout?.on('data', (data) => {
          this.handleOutput(data);
        });

        // Send initialize request
        this.sendInitialize().then(() => {
          this.log('Regal LSP initialized successfully');
          resolve();
        }).catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the Regal language server process
   */
  async stop(): Promise<void> {
    if (!this.regalProcess) {
      return;
    }

    return new Promise((resolve) => {
      if (!this.regalProcess) {
        return resolve();
      }

      // Send shutdown request
      this.sendRequest('shutdown', {}).then(() => {
        // Send exit notification
        this.sendNotification('exit', {});
        
        // Give it a moment to clean up
        setTimeout(() => {
          if (this.regalProcess) {
            this.regalProcess.kill();
            this.regalProcess = null;
          }
          resolve();
        }, 100);
      }).catch(() => {
        // Force kill if shutdown fails
        if (this.regalProcess) {
          this.regalProcess.kill();
          this.regalProcess = null;
        }
        resolve();
      });
    });
  }

  /**
   * Send initialize request to LSP
   */
  private async sendInitialize(): Promise<any> {
    const initParams = {
      processId: process.pid,
      rootUri: null,
      capabilities: {
        textDocument: {
          completion: {
            completionItem: {
              snippetSupport: true,
              documentationFormat: ['markdown', 'plaintext']
            }
          },
          hover: {
            contentFormat: ['markdown', 'plaintext']
          },
          definition: {
            linkSupport: true
          },
          diagnostic: {
            dynamicRegistration: true
          }
        },
        workspace: {
          workspaceFolders: true,
          configuration: true
        }
      }
    };

    const response = await this.sendRequest('initialize', initParams);
    
    // Send initialized notification
    this.sendNotification('initialized', {});
    
    return response;
  }

  /**
   * Send an LSP request
   */
  async sendRequest(method: string, params: any): Promise<any> {
    if (!this.regalProcess || !this.regalProcess.stdin) {
      throw new Error('Regal LSP is not running');
    }

    const id = this.messageId++;
    const message: LSPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener(`response-${id}`, responseHandler);
        reject(new Error(`Request ${method} timed out`));
      }, this.timeout);

      const responseHandler = (response: LSPMessage) => {
        clearTimeout(timer);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      };

      this.once(`response-${id}`, responseHandler);
      this.writeMessage(message);
    });
  }

  /**
   * Send an LSP notification (no response expected)
   */
  sendNotification(method: string, params: any): void {
    if (!this.regalProcess || !this.regalProcess.stdin) {
      throw new Error('Regal LSP is not running');
    }

    const message: LSPMessage = {
      jsonrpc: '2.0',
      method,
      params
    };

    this.writeMessage(message);
  }

  /**
   * Write LSP message to stdin
   */
  private writeMessage(message: LSPMessage): void {
    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
    const fullMessage = header + content;

    this.log('SEND:', message);
    this.regalProcess?.stdin?.write(fullMessage);
  }

  /**
   * Handle output from Regal LSP
   */
  private handleOutput(data: Buffer): void {
    this.messageBuffer += data.toString();

    while (true) {
      // Look for Content-Length header
      const headerMatch = this.messageBuffer.match(/Content-Length: (\d+)\r\n\r\n/);
      if (!headerMatch) {
        break;
      }

      const contentLength = parseInt(headerMatch[1], 10);
      const headerEnd = headerMatch.index! + headerMatch[0].length;
      
      // Check if we have the full message
      if (this.messageBuffer.length < headerEnd + contentLength) {
        break;
      }

      // Extract message
      const messageContent = this.messageBuffer.substring(headerEnd, headerEnd + contentLength);
      this.messageBuffer = this.messageBuffer.substring(headerEnd + contentLength);

      try {
        const message: LSPMessage = JSON.parse(messageContent);
        this.log('RECEIVE:', message);
        this.handleMessage(message);
      } catch (error) {
        this.log('Failed to parse message:', error);
      }
    }
  }

  /**
   * Handle parsed LSP message
   */
  private handleMessage(message: LSPMessage): void {
    if (message.id !== undefined) {
      // This is a response to our request
      this.emit(`response-${message.id}`, message);
    } else if (message.method) {
      // This is a notification or request from server
      this.emit('notification', message);
      this.emit(`notification-${message.method}`, message.params);
    }
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[Regal LSP Proxy]', ...args);
    }
  }

  /**
   * Check if Regal is running
   */
  isRunning(): boolean {
    return this.regalProcess !== null && !this.regalProcess.killed;
  }
}

/**
 * Singleton instance for application-wide use
 */
let regalLSPInstance: RegalLSPProxy | null = null;

export function getRegalLSP(config?: RegalLSPConfig): RegalLSPProxy {
  if (!regalLSPInstance) {
    regalLSPInstance = new RegalLSPProxy(config);
  }
  return regalLSPInstance;
}

export async function startRegalLSP(config?: RegalLSPConfig): Promise<RegalLSPProxy> {
  const lsp = getRegalLSP(config);
  if (!lsp.isRunning()) {
    await lsp.start();
  }
  return lsp;
}

export async function stopRegalLSP(): Promise<void> {
  if (regalLSPInstance && regalLSPInstance.isRunning()) {
    await regalLSPInstance.stop();
    regalLSPInstance = null;
  }
}

