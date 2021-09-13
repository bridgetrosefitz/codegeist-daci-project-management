# DACI Project management for Jira and Confluence

[Elevator pitch goes here]

[Link to the app goes here]

## Inspiration

D-A-C-I stands for Driver, Approver, Contributor, Informed.

From my experience in both technical and non-technical roles, the DACI framework is extremely helpful for project management. It enables me and my teammates to be clear about what each person is expected to do - and, importantly, what they're not expected to do! - and it promotes a timely flow of information to the people who need it.

The DACI resources shared by Atlassian are an awesome starting point for teams. The [DACI Decision Making Framework Play](https://www.atlassian.com/team-playbook/plays/daci) introduces the value of the DACI framework, and provide instructions for putting it into practice to make decisions. The Confluence and Trello templates provide a written record of who is D-A-C-I for a given decision, which can be referred back to after the kick-off meeting. And the [DACI Helper app](https://bitbucket.org/atlassian/forge-daci-helper/src/master/) makes it easier to see where the framework has not been implemented.

But there is more room for D-A-C-I to make our lives easier at work.

My Forge project builds on Atlassian's existing DACI resources. Its goal is three-fold:
1. Build DACI into the product development (or project management) flow, not just decision-making
2. Insert concrete actions into team members' workflows based on if they are D, A, C or I
3. Link non-technical teams into the product development process, so they can contribute their insights to the product, and have the latest product info to carry out their own roles


- Modify your app by editing the `src/index.jsx` file.

- Build and deploy your app by running:
```
forge deploy
```

- Install your app in an Atlassian site by running:
```
forge install
```

- Develop your app by running `forge tunnel` to proxy invocations locally:
```
forge tunnel
```

### Notes
- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.

## Support

See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help and provide feedback.
