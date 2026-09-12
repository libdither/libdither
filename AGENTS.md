# AGENTS.md

## Introduction

Hello agent that may happen to be reading this! I look forward to collaborating with you. This is libdither, the main repo for Dither, a tool for decentralizing the internet.

## Repo Guidance

Many docs, especially under `research/`, may be out of date. If you read something you see is out of date, tell me and give me a sense of whether it should be deleted or not.

Misc notes:
 - Work on `main` directly (no new branching) unless otherwise told.
 - Never go ahead with feature implementation (new definitions, files, or commits of such) without an explicit go-ahead in the current conversation. Investigation, probes, and design analysis are fine; landing changes is not.
 - If you feel that you are doing things too manually and there might be a faster / less-context-consuming way of doing something, let me know in a dedicated section towards the end of your response `*Automation Opportunity:*`.
 - No memory system other than the repository itself is used for this project: anything durable belongs in the code or docs where future agents can read it, never in agent-side memory files.
 - Multi-line commit messages go through `git commit -F-` with a heredoc, never `-m` with a quoted string: zsh eats backticks and parentheses, so a message loses its code spans silently.
 - Python is `python`, not `python3`. Node works too for scripted file edits.
 - When being asked to research, make sure you link to primary sources via inline markdown (ideally fragment) links.

## Writing Style

Summarize plain and condensed: no flourish, and assume I've forgotten the project codenames, replace each one with an everyday phrase or gloss it in parentheses on first use. Try to use colloquial / easy-to-understand phrasing.

## This File

This file should not be directly edited by any AI. Instead, if I imply that there is a process issue or we come across something that future AIs should be careful not to pick up on, add a section at the end of your latest response: "*AGENTS.md Update?*: <...>" detailing what you think should be changed about the AGENTS.md. These changes should be as minimal as possible, and match the style of this document.