# DACI Project management for Jira and Confluence

[Elevator pitch goes here]

[Link to the app goes here]

## Inspiration

### Some background on DACI

D-A-C-I stands for Driver, Approver, Contributor, Informed.

From my experience in both technical and non-technical roles, the DACI framework is extremely helpful for project management. It enables me and my teammates to be clear about what each person is expected to do - and, importantly, what they're not expected to do! - and it promotes a timely flow of information to the people who need it.

The DACI resources shared by Atlassian are an awesome starting point for teams. The [DACI Decision Making Framework Play](https://www.atlassian.com/team-playbook/plays/daci) introduces the value of the DACI framework, and provide instructions for putting it into practice to make decisions. The Confluence and [Trello](https://trello.com/b/6FT8JFEr/daci-decision-making-framework) templates provide a written record of who is D-A-C-I for a given decision, which can be referred back to after the kick-off meeting. And the [DACI Helper app](https://bitbucket.org/atlassian/forge-daci-helper/src/master/) makes it easier to see where the framework has not been implemented.

There is more room for D-A-C-I to make our lives easier, for teams that use Jira and Confluence. My Forge project builds on Atlassian's existing DACI resources, with a focus on three outcomes:
1. Build DACI into the product development (or project management) flow, not just decision-making
2. Insert concrete actions into team members' workflows based on if they are D, A, C or I
3. Link non-technical teams into the product development process, so they can contribute their insights to the product, and have the latest product info to carry out their own roles

### Examples from my career

XXX


## What does the app do?

### Functionality

XXX

### Design choices

XXX

## How I built the app

This app is built entirely in Forge. All my development and testing was done internally to the Forge ecosystem, essentially connecting the dots in new ways between Jira and Confluence modules, combining them in new ways and wrapping new functionality in Forge UI components for the user.

The app uses both Jira and confluence modules, specifically: XXX, XXX and XXX. 

Applying the principal of separation of concerns, I created individual JSX files for Global Settings and the DACI Action Panel respectively. I imported these into, and re-exported them from, the index.jsx file, and referenced them accordingly in my manifest.yml file.

To build funcionality, I wrote components and methods in Forge's version of JSX, making calls to the Jira and Confluence REST APIs.

## What I learnt

This experience has been my entrée into the Forge environment, and was my first time developing for Atlassian products. Here are a few bullets on what my Forge learning looked like!
- I learnt how to build, deploy, tunnel and debug in Forge
- I learnt the lay of the land of Forge docs, and how to sniff around to find the endpoints I needed
- I learnt how to make calls to the Jira and Confluence APIs using the route convention, and applying the fetch conventions I was already familiar with

At a meta level, I developed my thinking about the contexts in which DACI can be applied. I had never explicitly thought about the difference between how DACI can be applied at a decision-making level vs a project management level. My personal experience with DACI encompassed both and I had never drawn a distinction between the two. Reading the Atlassian playbook docs and templates made me see how DACI can play out somewhat differently in a decision-making context, as opposed to in project management. Decision-making is in some ways more static and centralized than project management, where many different granular tasks are carried out and are constantly changing. This leads to a different implementation problem for DACI in each context. It seems to me that decision-making is more suited to a single fixed document treatment of DACI, whereas in project management requires DACI to be inserted into the workflow in a dynamic yet structured way.


## Where to next?

I Was only able to throw myself into the Codegeist hackathon for a few days before the deadline. But I wanted to build something because I'm bloody passionate about DACI, and I was excited about the way it could be more tightly integrated into Jira and Confluence. 

In future, the app could be expanded to:
- XXX
- XXX
- XXX

