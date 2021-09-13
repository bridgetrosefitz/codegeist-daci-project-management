# DACI Project management for Jira and Confluence
## Inspiration

### Some background on DACI

D-A-C-I stands for Driver, Approver, Contributor, Informed.

From my experience in both technical and non-technical roles, the DACI framework is extremely helpful for project management. It enables me and my teammates to be clear about what each person is expected to do - and, importantly, what they're not expected to do! - and it promotes a timely flow of information to the people who need it.

The DACI resources shared by Atlassian are an awesome starting point for teams. The [DACI Decision Making Framework Play](https://www.atlassian.com/team-playbook/plays/daci) introduces the value of the DACI framework, and provide instructions for putting it into practice to make decisions. Similarly, the Confluence and [Trello](https://trello.com/b/6FT8JFEr/daci-decision-making-framework) templates provide a written record of who is D-A-C-I for a given decision, which can be referred back to after the kick-off meeting. And the [DACI Helper app](https://bitbucket.org/atlassian/forge-daci-helper/src/master/) makes it easier to see where the framework has not been implemented.

But there is a lot of room to apply DACI in new ways, to make our lives even easier for teams that use Jira and Confluence. My Forge project builds on Atlassian's existing DACI resources, with a focus on three outcomes:
1. Build DACI into the product development (or project management) flow, not just decision-making
2. Insert concrete actions into team members' workflows based on if they are D, A, C or I
3. Link non-technical teams into the product development process, so they can contribute their insights to the product, and have the latest product info to carry out their own roles

### Examples from my career

In a past life, when I was working at a small tech start-up in customer support and operations, there were many times where it was important for me to be a Contributor or Informed on things that were happening in the product team. Because I knew what our customers’ experiences with the app were so I could share cool ideas on what to build, and because if there was a feature or bug update, I needed to be the first to know, so I could explain it to users who would call us because they had questions or were having trouble.

Another use-case for DACI in my role at that start-up was a time when I had a manager join the company ‘above’ me. As a result, myself and my other customer support teammates were no longer as involved in product meetings as we had been before, and so we needed a more formal process to make sure we got updates about what was being built by the product team. In other words, when we weren’t directly participating in product development, we needed a dedicated workflow to meet our needs of being ‘Informed’ and ‘Contributing’, so we could keep doing our jobs well. Because if my manager left a product meeting and got distracted, forgetting to jot down a to-do of updating us on a new feature that was put in this week’s sprint and why that decision was made, we may have missed our opportunity to give the input we were supposed to, and we may have been be surprised when a user called us about a bug that we have no context on. Also, it’s better if managers can use their time to actually help develop the product, instead of managing the flow of information! So whatever you can automate to keep the team able to Contribute and be Informed is a win.

Like all of us, I have also had cases where I have been asked to do work in an area that is not my focus. This app would easily enable me to quantify how many items I am being asked to Contribute to per week, so can have a conversation with my manager about how much time I have available and how many things I can realistically be a Contributor on.

## What it does

The app:
- Allows you to map team roles (or 'groups', as it is implemented) such as customer support, sales, marketing, legal or product, to DACI functions, by specifying which of these roles should be considered D-A-C or I. Individual users can also be nominated for, or excluded from, any DACI function 
- Creates a one-stop-shop for team members to monitor the DACI actions they need to take. This is called the DACI Action Panel, and it appears on the Confluence home screen
- Programmatically sends actions into a queue of work for each user based on that user's DACI function in relation to an issue in a Jira project. For example, a Contributor is prompted to approve or disapprove of an issue and provide comments; the Driver is prompted to deal with every piece of Contributor input that flows through; people who are 'Informed' are prompted to formally acknowledge that they have seen issue updates
- Provides health stats on the DACI process as a whole, to prompt the Driver or Approver to intervene if responsibilities are falling behind

## How I built it

This app is built entirely in Forge. All my development and testing was done internally to the Forge ecosystem, essentially connecting the dots in new ways between Jira and Confluence modules, combining them and wrapping new functionality in Forge UI components for the user.

The app uses both Jira and Confluence modules, specifically: confluence:globalSettings, confluence:homepageFeed,  and jira:customField. 

Applying the principal of separation of concerns, I created individual JSX files for Global Settings and the DACI Action Panel respectively. I imported these into, and re-exported them from, the index.jsx file, and referenced them accordingly in my manifest.yml file.

To build functionality, I wrote components and methods in Forge's version of JSX, making calls to the Jira and Confluence REST APIs.

## Challenges I ran into

In the initial stages of building the logic for my app, I spent a lot of time understanding and experimenting with API endpoints to figure out two core things:
1. Make GET requests to return issues, understanding the structure and syntax of the objects returned
2. Make PUT requests to custom fields that I created using the Jira custom field module

Many things were easy about Forge - these two things were not. Specifically, I had the following struggles:
- The endpoint name for issues - the best one I managed to find - was not intuitive, and did not provide the option to return only certain issues based on query params. Instead, I had to return every single issue and filter them on the client side. Which was ok for just a few issues, but would quickly become very inefficient!! The endpoint I'm referring to is api.asApp().requestJira(route`/rest/api/3/search?fields=*all`)
- I wasn't able to specify the ID of the custom fields I created, so I had to write logic to grab the ID based on the name of the field, after returning all fields. I would have loved to be able to search for the name of the field in the GET request, or even better, just specify the ID in the manifest
- Endpoints I used for some queries are indicated as being experimental
- Getting my app to look pretty was difficult because the UI kit still has a lot of limitations, especially the fact that it has only very few attributes on components and doesn't expose any CSS anywhere. You probably do this on purpose, but it made it challenging for me to make my app visually appealing

Apart from these technical frustrations, an important challenge was deciding on the core functionality of the app: what features should I build which would add value compared to what already exists in Jira and Confluence, to simplify the implementation of DACI? 

I spent a bunch of time trying to fit existing features like 'watching', notifications and emails to DACI. But the essence of the value I wanted to build was to bring DACI-related actions into team members' workflows, and build checks to monitor the health of these actions across the team. If I had used watching, notifications or emails, these features would have been overloaded with different purposes, making team members' workflows more distracted and the required action less clear. 

In the end, for this first version of the app, I decided to focus on a few core automated features I wish I had had on projects in the past (see Functionality section).

## Accomplishments that I'm proud of

I am really proud of building an app with functionality that I believe will really help teams - something I am excited to use myself, which can help get maximum value out of the DACI principles.

I am also very proud of having built this in about three days only, in which time I learnt an entirely new development environment. I just recently found the Codegeist hackathon but still wanted to contribute because I'm passionate about DACI and was excited to build it into Jira and Confluence. 
 
## What I learned

This experience has been my entrée into the Forge environment, and was my first time developing for Atlassian products. Here are a few bullets on what my Forge learning looked like!
- I learnt how to build, deploy, tunnel and debug in Forge
- I learnt the lay of the land of Forge docs, and how to sniff around to find the endpoints I needed
- I learnt how to make calls to the Jira and Confluence APIs using the 'route' convention, and applying the fetch conventions I was already familiar with
- I learnt how to use the storage API and integrate settings across different modules
- I learnt how to use the UI kit

At a meta level, I developed my thinking about the contexts in which DACI can be applied. I had never explicitly thought about the difference between how DACI can be applied at a decision-making level vs a project management level. My personal experience with DACI encompassed both of these, and I had never drawn a distinction between the two. Reading the Atlassian playbook docs and templates made me see how DACI can play out somewhat differently in a decision-making context, as opposed to in project management. Decision-making is in some ways more static and centralized than project management, where many different granular tasks are carried out and are constantly changing. This leads to a different implementation problem for DACI in each context. It seems to me that decision-making is more suited to a single fixed document treatment of DACI, whereas project management requires DACI to be inserted into the workflow in a dynamic yet structured way.

## What's next for DACI Project Management for Jira and Confluence
I would love to:
- revisit the styling of the app. Because I believe good design makes people trust a product
- link into Jira's flagging functionality to automatically notify the Approver that someone is doing work outside their role
-  build time / expectation-based functionality for things such as if a Driver has not dealt with a Contributor's item, if a Contributor hasn't given feedback, if an Informed person has not acknowledged for X days... what to do about that. For example, send a notification, make a new action item for the Approver to follow up; have an alert message on the Project.
- build status and workflow restrictions based on DACI settings. For example, you cannot move an issue from Needs Review to Done without all contributors signing off
- enhance project-level settings, so that the people who are D-A-C-I can be set at the project level not the company level

