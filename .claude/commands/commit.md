---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Create a git commit
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task

Based on the above changes, create a single git commit.
- Be short but provide the essence of changes. 
- Reference issue numbers when applicable.
- Commit messages should describe WHY, not HOW
- Do not list WHAT has been done
- IF the current branch is "main", create a new branch and commit all changes there
- Do not mention to AI, Claude, or Anthropic in the commit message
- Never add "Co-Authored-By" and "Claude" in the commit message
- Use code-reviewver-committer agent