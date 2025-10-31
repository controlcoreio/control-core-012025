export interface RegoAST {
  type: string;
  value?: any;
  children?: RegoAST[];
  start: number;
  end: number;
}

export interface ParseError {
  message: string;
  start: number;
  end: number;
}

export class RegoParser {
  private tokens: string[] = [];
  private current = 0;

  parse(text: string): RegoAST {
    this.tokens = this.tokenize(text);
    this.current = 0;
    
    try {
      return this.parseDocument();
    } catch (error) {
      throw new ParseError(`Parse error: ${error}`, 0, text.length);
    }
  }

  private tokenize(text: string): string[] {
    // Simple tokenization for Rego
    const tokens: string[] = [];
    const regex = /(\s+)|(\w+)|([{}[\]()])|(:=|==|!=|<=|>=|<|>)|([+\-*/%])|([,;])|(["'][^"']*["'])/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match[1]) continue; // Skip whitespace
      tokens.push(match[0]);
    }

    return tokens;
  }

  private parseDocument(): RegoAST {
    const children: RegoAST[] = [];
    
    while (!this.isAtEnd()) {
      if (this.match('package')) {
        children.push(this.parsePackage());
      } else if (this.match('import')) {
        children.push(this.parseImport());
      } else if (this.match('default')) {
        children.push(this.parseDefault());
      } else if (this.match('allow', 'deny')) {
        children.push(this.parseRule());
      } else if (this.match('violation')) {
        children.push(this.parseRule());
      } else {
        this.advance();
      }
    }

    return {
      type: 'Document',
      children,
      start: 0,
      end: this.tokens.length
    };
  }

  private parsePackage(): RegoAST {
    const start = this.current;
    this.advance(); // package
    
    const name = this.consume('IDENTIFIER', 'Expected package name');
    
    return {
      type: 'Package',
      value: name,
      start,
      end: this.current
    };
  }

  private parseImport(): RegoAST {
    const start = this.current;
    this.advance(); // import
    
    const path = this.consume('STRING', 'Expected import path');
    const alias = this.match('as') ? this.advance() && this.consume('IDENTIFIER', 'Expected alias') : null;
    
    return {
      type: 'Import',
      value: { path, alias },
      start,
      end: this.current
    };
  }

  private parseDefault(): RegoAST {
    const start = this.current;
    this.advance(); // default
    
    const name = this.consume('IDENTIFIER', 'Expected default name');
    this.consume('=', 'Expected =');
    const value = this.parseExpression();
    
    return {
      type: 'Default',
      value: { name, value },
      start,
      end: this.current
    };
  }

  private parseRule(): RegoAST {
    const start = this.current;
    const name = this.advance(); // rule name
    
    const params: RegoAST[] = [];
    if (this.match('(')) {
      this.advance(); // (
      while (!this.match(')') && !this.isAtEnd()) {
        params.push(this.parseExpression());
        if (this.match(',')) this.advance();
      }
      this.consume(')', 'Expected )');
    }
    
    const body = this.parseRuleBody();
    
    return {
      type: 'Rule',
      value: { name, params, body },
      start,
      end: this.current
    };
  }

  private parseRuleBody(): RegoAST[] {
    const body: RegoAST[] = [];
    
    if (this.match('{')) {
      this.advance(); // {
      while (!this.match('}') && !this.isAtEnd()) {
        body.push(this.parseExpression());
        if (this.match(',')) this.advance();
      }
      this.consume('}', 'Expected }');
    }
    
    return body;
  }

  private parseExpression(): RegoAST {
    if (this.match('IDENTIFIER')) {
      return this.parseIdentifier();
    } else if (this.match('STRING')) {
      return this.parseString();
    } else if (this.match('NUMBER')) {
      return this.parseNumber();
    } else if (this.match('[')) {
      return this.parseArray();
    } else if (this.match('{')) {
      return this.parseObject();
    } else {
      throw new Error(`Unexpected token: ${this.peek()}`);
    }
  }

  private parseIdentifier(): RegoAST {
    const start = this.current;
    const value = this.advance();
    
    return {
      type: 'Identifier',
      value,
      start,
      end: this.current
    };
  }

  private parseString(): RegoAST {
    const start = this.current;
    const value = this.advance();
    
    return {
      type: 'String',
      value: value.slice(1, -1), // Remove quotes
      start,
      end: this.current
    };
  }

  private parseNumber(): RegoAST {
    const start = this.current;
    const value = this.advance();
    
    return {
      type: 'Number',
      value: parseFloat(value),
      start,
      end: this.current
    };
  }

  private parseArray(): RegoAST {
    const start = this.current;
    this.advance(); // [
    
    const elements: RegoAST[] = [];
    while (!this.match(']') && !this.isAtEnd()) {
      elements.push(this.parseExpression());
      if (this.match(',')) this.advance();
    }
    
    this.consume(']', 'Expected ]');
    
    return {
      type: 'Array',
      children: elements,
      start,
      end: this.current
    };
  }

  private parseObject(): RegoAST {
    const start = this.current;
    this.advance(); // {
    
    const properties: RegoAST[] = [];
    while (!this.match('}') && !this.isAtEnd()) {
      const key = this.parseExpression();
      this.consume(':', 'Expected :');
      const value = this.parseExpression();
      properties.push({
        type: 'Property',
        value: { key, value },
        start: key.start,
        end: value.end
      });
      if (this.match(',')) this.advance();
    }
    
    this.consume('}', 'Expected }');
    
    return {
      type: 'Object',
      children: properties,
      start,
      end: this.current
    };
  }

  private match(...types: string[]): boolean {
    if (this.isAtEnd()) return false;
    return types.includes(this.peek());
  }

  private advance(): string {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek() === 'EOF';
  }

  private peek(): string {
    return this.tokens[this.current] || 'EOF';
  }

  private previous(): string {
    return this.tokens[this.current - 1];
  }

  private consume(type: string, message: string): string {
    if (this.match(type)) return this.advance();
    throw new Error(message);
  }
}
