
import React from "react";

interface Author {
  initials: string;
  name: string;
  color: string;
}
interface Commit {
  id: string;
  policyName: string;
  message: string;
  description: string;
  author: Author;
  timeAgo: string;
  version: string;
  branch: string;
  environment: string;
}

interface Environment {
  value: string;
  label: string;
  tagColor: string;
}

interface CommitHistoryTableProps {
  commits: Commit[];
  allCommitsCount: number;
  environments: Environment[];
}

export function CommitHistoryTable({ commits, environments }: CommitHistoryTableProps) {
  return (
    <table className="min-w-full text-sm border bg-background rounded">
      <thead className="bg-muted font-semibold">
        <tr>
          <th className="px-3 py-2">Policy Name</th>
          <th className="px-3 py-2">Message</th>
          <th className="px-3 py-2">Description</th>
          <th className="px-3 py-2">Author</th>
          <th className="px-3 py-2">Version</th>
          <th className="px-3 py-2">Branch</th>
          <th className="px-3 py-2">Instance</th>
          <th className="px-3 py-2">Time</th>
        </tr>
      </thead>
      <tbody>
        {commits.map((commit) => {
          const env = environments.find(e => e.value === commit.environment);
          return (
            <tr key={commit.id} className="border-b">
              <td className="px-3 py-2 font-semibold">{commit.policyName}</td>
              <td className="px-3 py-2">{commit.message}</td>
              <td className="px-3 py-2 w-[220px]">{commit.description}</td>
              <td className="px-3 py-2">
                <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${commit.author.color}`}>
                  {commit.author.initials}
                </span>
                <span className="ml-2">{commit.author.name}</span>
              </td>
              <td className="px-3 py-2">{commit.version}</td>
              <td className="px-3 py-2">{commit.branch}</td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${env?.tagColor ?? 'bg-gray-200 text-gray-700'}`}>
                  {env ? env.label : commit.environment}
                </span>
              </td>
              <td className="px-3 py-2">{commit.timeAgo}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
