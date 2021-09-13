import ForgeUI, {
  render,
  Text,
  Link,
  HomepageFeed,
  useEffect,
  useState,
  RadioGroup, 
  Radio,
  Button,
  useProductContext,
  Tabs,
  Tab,
  Form,
  TextArea,
  Heading,
  Table,
  Cell,
  Head,
  Row,
  SectionMessage,
  Avatar,
  Fragment,
  Strong,
  Em
} from '@forge/ui';
import api, { route, storage } from '@forge/api';

const App = () => {
  const { accountId } = useProductContext();

  const [daciInformedField, setDaciInformedField] = useState(null);
  const [daciContributorField, setDaciContributorField] = useState(null);
  const [issues, setIssues] = useState([]);
  const [completedIssues, setCompletedIssues] = useState([]);
  const [contributorIssues, setContributorIssues] = useState([]);
  const [driverIssues, setDriverIssues] = useState([]);
  const [userGroups, setUserGroups] = useState([])
  const [settings, setSettings] = useState({
    contributor: {
      groups: [],
      users: [],
      excludedUsers: [],
    },
    informed: {
      groups: [],
      users: [],
      excludedUsers: [],
    },
  })

  const userAcknowledged = issue => issue.fields[daciInformedField.id].some(user => user.accountId === accountId)
  const userContributed = issue => issue.fields[daciContributorField.id] && issue.fields[daciContributorField.id].contributors.some(user => user.accountId === accountId)
  
  
  const getSettings = async () => {
    const globalDaciSettings = await storage.get('daci-global-settings');
    return globalDaciSettings
  }

  const getDaciFields = async () => {
    const response = await api.asApp().requestJira(route`/rest/api/3/field`);
    const fields = await response.json();
    const daciInformedField = fields.find(field => field.name === 'DACI Informed List')
    const daciContributorField = fields.find(field => field.name === 'DACI Contributor List')
    setDaciInformedField(daciInformedField)
    setDaciContributorField(daciContributorField)
    
  }

  const getIssues = async () => {
    const response = await api.asApp().requestJira(route`/rest/api/3/search?fields=*all`);
    const { issues } = await response.json()
    const settings = await getSettings()
    const driverIssues = issues.filter(issue => issue.fields.assignee && issue.fields.assignee.accountId === accountId)
    const completedIssues = issues.filter(issue => issue.fields.status.id === settings.informed[issue.fields.project.id])
    const contributorIssues = issues.filter(issue => issue.fields.status.id === settings.contributor[issue.fields.project.id])
    setIssues(issues)
    setDriverIssues(driverIssues)
    setContributorIssues(contributorIssues)
    setCompletedIssues(completedIssues)
    setSettings(settings)
  }

  const getUserGroups = async () => {
    const response = await api.asApp().requestJira(route`/rest/api/3/user/groups?accountId=${accountId}`)
    const groups = await response.json()
    const groupNames = groups.map(group => group.name)
    setUserGroups(groupNames)
  }
  
  const acknowledgeIssue = async (issue) => {
    const informedUsers = issue.fields[daciInformedField.id] || [];
    if (!userAcknowledged(issue)) {
      await api.asApp().requestJira(route`/rest/api/3/app/field/${daciInformedField.id}/value`, {
        method: 'PUT',
        body: JSON.stringify({
          updates: [{
            issueIds: [issue.id],
            value: [...informedUsers, { accountId }]
          }]
        })
      });
      await getIssues()
    }
  }

  const contributeToIssue = async (issue, formData) => {
    const contributedUsers = (issue.fields[daciContributorField.id] && issue.fields[daciContributorField.id].contributors) || [];
    if (!userContributed(issue)) {
      await api.asApp().requestJira(route`/rest/api/3/app/field/${daciContributorField.id}/value`, {
        method: 'PUT',
        body: JSON.stringify({
          updates: [{
            issueIds: [issue.id],
            value: {
              contributors: [...contributedUsers, { accountId, comment: formData.message, approved: JSON.parse(formData.approval) }]
            }
          }]
        })
      });
      await getIssues()
    }
  }

  const driverDealWithFeedback = async (issue, addressedUser) => {
    const contributedUsers = (issue.fields[daciContributorField.id] && issue.fields[daciContributorField.id].contributors) || [];
    
    if (!contributedUsers.some(user => user.driverAcknowledgedAccountId === accountId)) {
      const updatedContributedUsers = [...contributedUsers.map(user => {
        if (user.accountId === addressedUser.accountId && !user.driverAcknowledgedAccountId) {
          user.driverAcknowledgedAccountId = accountId
        }
        return user
      })]
      await api.asApp().requestJira(route`/rest/api/3/app/field/${daciContributorField.id}/value`, {
        method: 'PUT',
        body: JSON.stringify({
          updates: [{
            issueIds: [issue.id],
            value: {
              contributors: updatedContributedUsers
            }
          }]
        })
      });
      await getIssues()
    }
  }


  useEffect(async () => {
    await getDaciFields()
    await getIssues()
    await getUserGroups()
  }, [])

  const partOfInformedGlobalGroup = (daciRole) => userGroups.some(userGroup => settings[daciRole].groups.includes(userGroup))
  const partOfInformedUserGlobalGroup = (daciRole) => settings[daciRole].users.includes(accountId)
  const partOfInformedExcludeUserGlobalGroup = (daciRole) => settings[daciRole].excludedUsers.includes(accountId)
  const globalPermissions = (daciRole) => (partOfInformedGlobalGroup(daciRole) || partOfInformedUserGlobalGroup(daciRole)) && !partOfInformedExcludeUserGlobalGroup(daciRole)

  const needsAcknowledgmentIssues = completedIssues.filter(issue => !userAcknowledged(issue) && globalPermissions('informed'))
  const acknowledgedIssues = completedIssues.filter(issue => userAcknowledged(issue) && globalPermissions('informed'))
  const needsAcknowledgmentCount = needsAcknowledgmentIssues.length > 0 ? ` (${needsAcknowledgmentIssues.length})` : ''

  const needsContributorIssues = contributorIssues.filter(issue => !userContributed(issue) && globalPermissions('contributor'))
  const contributedIssues = contributorIssues.filter(issue => userContributed(issue) && globalPermissions('contributor'))
  const needsContributorCount = needsContributorIssues.length > 0 ? ` (${needsContributorIssues.length})` : ''


  const driverPotentialActionableIssues = driverIssues.filter(issue => issue.fields[daciContributorField.id] && issue.fields[daciContributorField.id].contributors.length > 0)
  const driverActionableIssues = driverPotentialActionableIssues.filter(issue => issue.fields[daciContributorField.id] && !issue.fields[daciContributorField.id].contributors.some(user => user.driverAcknowledgedAccountId === accountId))
  const driverActionedIssues = driverPotentialActionableIssues.filter(issue => issue.fields[daciContributorField.id] && issue.fields[daciContributorField.id].contributors.some(user => user.driverAcknowledgedAccountId === accountId))

  const numberOfActionsThatCouldBeTaken = driverPotentialActionableIssues.length
  const numberOfActionsCompleted = driverPotentialActionableIssues.filter(issue => issue.fields[daciContributorField.id] && issue.fields[daciContributorField.id].contributors.some(user => user.driverAcknowledgedAccountId)).length

  const numberOfTotalContributionsThatCouldBeTaken = contributorIssues.length
  const numberOfContributionsMade = contributorIssues.filter(issue => issue.fields[daciContributorField.id] && issue.fields[daciContributorField.id].contributors.some(user => user.accountId)).length
  let numberOfTimesIssuesHaveBeenInformed = 0
  issues.forEach(issue => issue.fields[daciInformedField.id].forEach(() => numberOfTimesIssuesHaveBeenInformed++))
  let totalContributions = 0
  let totalPotentialContributions = 0
  contributorIssues.forEach(issue => issue.fields[daciContributorField.id] && issue.fields[daciContributorField.id].contributors.forEach(user => {
    if (user.driverAcknowledgedAccountId) {
      totalContributions++
    }
    totalPotentialContributions++
  }))
  completedIssues.forEach(issue => issue.fields[daciContributorField.id] && issue.fields[daciContributorField.id].contributors.forEach(user => {
    if (user.driverAcknowledgedAccountId) {
      totalContributions++
    }
    totalPotentialContributions++
  }))
  
  return (
    <Tabs>
      <Tab label={`Driver (${driverActionableIssues.length})`}>
        {driverActionableIssues.length > 0 && (
    
            <Text><Strong>To do</Strong></Text>
        )}
        {
          driverActionableIssues.map(issue => issue.fields[daciContributorField.id].contributors.map(user => (
            <SectionMessage title={`Contribution needs review`} appearance="change">
              <Table>
                <Head>
                  <Cell>
                    <Text>Issue</Text>
                  </Cell>
                  <Cell>
                    <Text>Contributor</Text>
                  </Cell>
                  <Cell>
                    <Text>Status</Text>
                  </Cell>
                  <Cell>
                    <Text>Comment</Text>
                  </Cell>
                </Head>
                <Row>
                  <Cell>
                    <Text>
                        <Link href={`/browse/${issue.key}`}>{issue.fields.summary}</Link>
                    </Text>
                  </Cell>
                  <Cell>
                      <Avatar accountId={user.accountId} />
                  </Cell>
                  <Cell>
                      <Text>{user.approved ? "👍" : "👎"}</Text>
                  </Cell>
                  <Cell>
                      <Text><Em>{user.comment}</Em></Text>
                  </Cell>
                </Row>
              </Table>
              <Button icon="check" text="This contribution is dealt with" onClick={() => driverDealWithFeedback(issue, user)} />
            </SectionMessage>
          ))).flat()
        }
        {driverActionedIssues.length > 0 && (
        <Fragment>
          <Heading size="small">Done</Heading>
          <Table>
            <Head>
              <Cell>
                <Text>Issue</Text>
              </Cell>
              <Cell>
                <Text>Contributor</Text>
              </Cell>
              <Cell>
                <Text>Status</Text>
              </Cell>
              <Cell>
                <Text>Comment</Text>
              </Cell>
            </Head>
            {
              driverActionedIssues.map(issue => issue.fields[daciContributorField.id].contributors.map(user => (
              <Row>
                <Cell>
                  <Text>
                    <Link href={`/browse/${issue.key}`}>{issue.fields.summary}</Link>
                  </Text>
                </Cell>
                <Cell>
                  <Avatar accountId={user.accountId} />
                </Cell>
                <Cell>
                  <Text>{user.approved ? "👍" : "👎"}</Text>
                </Cell>
                <Cell>
                    <Text><Em>{user.comment}</Em></Text>
                </Cell>
              </Row>
            ))).flat()
            }
          </Table>
        </Fragment>
        )}
      </Tab>
      <Tab label={`Approver`}>
      
        <Fragment>
          <Heading size="small">Health stats</Heading>
          <SectionMessage 
            appearance="info"
            title={`Driver`}>
            <Text>Drivers have dealt with {totalContributions} of {totalPotentialContributions} Contributor submissions <Strong>({((parseFloat(totalContributions) / parseFloat(totalPotentialContributions)) * 100).toFixed(0)}%)</Strong></Text>
          </SectionMessage>
          <SectionMessage 
            appearance="info"
            title={`Contributor`}>
            <Text>Contributors have made their submissions for {totalPotentialContributions} of {totalPotentialContributions} issues <Strong>({((parseFloat(totalPotentialContributions) / parseFloat(totalPotentialContributions)) * 100).toFixed(0)}%)</Strong> </Text>
            </SectionMessage>
          <SectionMessage 
            appearance="info"
            title={`Informed`}>
             <Text>Users have been informed of issues {numberOfTimesIssuesHaveBeenInformed} times</Text>
             </SectionMessage>
        </Fragment>
      </Tab>
      <Tab label={`Contributor ${needsContributorCount}`}>
        {needsContributorIssues.length > 0 && (
          <Heading size="small">To do</Heading>
        )}
        {needsContributorIssues.map(issue => (
          <SectionMessage title={`Issue needs contribution: ${issue.fields.summary}`} appearance="change">
            <Text>
              <Link openNewTab href={`/browse/${issue.key}`}>View issue in Jira</Link>
            </Text>
            <Form onSubmit={(data) => contributeToIssue(issue, data)} submitButtonText="Submit contribution">
              <RadioGroup isRequired name="approval" label="Give this issue a thumbs up or down" >
                <Radio label="👍" value="true" />
                <Radio label="👎" value="false" />
              </RadioGroup>
              <TextArea label="Give detailed comment (optional)" name="message" />
            </Form>
          </SectionMessage>
        ))}
        <Heading size="small">Done</Heading>
        <Table>
          <Head>
            <Cell>
              <Text>Issue</Text>
            </Cell>
            <Cell>
              <Text>Status</Text>
            </Cell>
            <Cell>
              <Text>Comment</Text>
            </Cell>
          </Head>
          {contributedIssues.map(issue => (
            <Row>
              <Cell>
                <Text>
                  <Link href={`/browse/${issue.key}`}>{issue.fields.summary}</Link>
                </Text>
              </Cell>
              <Cell>
                <Text>{issue.fields[daciContributorField.id].contributors.find(user => user.accountId === accountId).approved ? "👍" : "👎"}</Text>
              </Cell>
              <Cell>
                <Text><Em>{issue.fields[daciContributorField.id].contributors.find(user => user.accountId === accountId).comment}</Em></Text>
              </Cell>
            </Row>
          ))}
        </Table>
      </Tab>
      <Tab label={`Informed${needsAcknowledgmentCount}`}>
        {needsAcknowledgmentIssues.length > 0 && (
          <Heading size="small">To do</Heading>
        )}
        {needsAcknowledgmentIssues.map(issue => (
          <SectionMessage title={`Acknowledge issue: ${issue.fields.summary}`} appearance="info">
            <Table>
              <Head>
                <Cell>
                  <Text>Issue</Text>
                </Cell>
              </Head>
              <Row>
                <Cell>
                  <Text>
                    <Link href={`/browse/${issue.key}`}>{issue.fields.summary}</Link>
                  </Text>
                </Cell>
              </Row>
            </Table>
            <Button text="I'm informed" onClick={() => acknowledgeIssue(issue)} />
          </SectionMessage>
        ))}
        <Heading size="small">Done</Heading>
        <Table>
          <Head>
            <Cell>
              <Text>Issue</Text>
            </Cell>
          </Head>
          {acknowledgedIssues.map(issue => (
            <Row>
              <Cell>
                <Text>
                  <Link href={`/browse/${issue.key}`}>{issue.fields.summary}</Link>
                </Text>
              </Cell>
            </Row>
          ))}
        </Table>
      </Tab>
    </Tabs>
  )
};

export default render(
  <HomepageFeed>
    <App />
  </HomepageFeed>
);