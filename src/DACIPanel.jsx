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
  Strong
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
  const driverActionableIssues = driverPotentialActionableIssues.filter(issue => !issue.fields[daciContributorField.id].contributors.some(user => user.driverAcknowledgedAccountId === accountId))
  const driverActionedIssues = driverPotentialActionableIssues.filter(issue => issue.fields[daciContributorField.id].contributors.some(user => user.driverAcknowledgedAccountId === accountId))

  const numberOfActionsThatCouldBeTaken = driverPotentialActionableIssues.length
  const numberOfActionsCompleted = driverPotentialActionableIssues.filter(issue => issue.fields[daciContributorField.id].contributors.some(user => user.driverAcknowledgedAccountId)).length

  const numberOfTotalContributionsThatCouldBeTaken = contributorIssues.length
  const numberOfContributionsMade = contributorIssues.filter(issue => issue.fields[daciContributorField.id].contributors.some(user => user.accountId)).length
  let numberOfTimesIssuesHaveBeenInformed = 0
  issues.forEach(issue => issue.fields[daciInformedField.id].forEach(() => numberOfTimesIssuesHaveBeenInformed++))

  
  return (
    <Tabs>
      <Tab label={`Driver (${driverActionableIssues.length})`}>
        {driverActionableIssues.length > 0 && (
          <Heading size="small">To do</Heading>
        )}
        {
          driverActionableIssues.map(issue => issue.fields[daciContributorField.id].contributors.map(user => (
            <SectionMessage title={issue.fields.summary} appearance="change">
              <Text>
                <Link href={`/browse/${issue.key}`}>Link to Issue</Link>
              </Text>
              <Text>{user.approved ? "👍" : "👎"} "{user.comment}"</Text>
              <Avatar accountId={user.accountId}/>
              <Button text="This is dealt with" onClick={() => driverDealWithFeedback(issue, user)} />
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
                <Text>Approval</Text>
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
                  <Text>"{user.comment}"</Text>
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
          <Heading size="small">Health Stats</Heading>
          {/* {driverPotentialActionableIssues.length} */}
          <Heading size="medium">
            <Text><Strong>{numberOfActionsCompleted}</Strong> of <Strong>{numberOfActionsThatCouldBeTaken} Driver Issues</Strong> are incorporating <Strong>Contributor's Feedback</Strong>: {((parseFloat(numberOfActionsCompleted) / parseFloat(numberOfActionsThatCouldBeTaken)) * 100).toFixed(2)}%</Text>
          </Heading>
          <Heading size="medium">
            <Text><Strong>{numberOfContributionsMade}</Strong> of <Strong>{numberOfTotalContributionsThatCouldBeTaken} Contributor's Feedback</Strong> is being written: {((parseFloat(numberOfContributionsMade) / parseFloat(numberOfTotalContributionsThatCouldBeTaken)) * 100).toFixed(2)}%</Text>
          </Heading>
          <Heading size="medium">
            <Text>Users have been <Strong>Informed</Strong> of issues <Strong>{numberOfTimesIssuesHaveBeenInformed}</Strong> times</Text>
          </Heading>
        </Fragment>
      </Tab>
      <Tab label={`Contributions ${needsContributorCount}`}>
        {needsContributorIssues.length > 0 && (
          <Heading size="small">To do</Heading>
        )}
        {needsContributorIssues.map(issue => (
          <SectionMessage title={issue.fields.summary} appearance="change">
            <Text>
              <Link href={`/browse/${issue.key}`}>Link to Issue</Link>
            </Text>
            <Form onSubmit={(data) => contributeToIssue(issue, data)} submitButtonText="Consult this task">
              <RadioGroup isRequired name="approval" label="approve this task" description="please approve this task">
                <Radio label="👍" value="true" />
                <Radio label="👎" value="false" />
              </RadioGroup>
              <TextArea label="Message" name="message" />
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
              <Text>Approval</Text>
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
                <Text>"{issue.fields[daciContributorField.id].contributors.find(user => user.accountId === accountId).comment}"</Text>
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
          <SectionMessage title={issue.fields.summary} appearance="info">
            <Text>
              <Link href={`/browse/${issue.key}`}>Link to Issue</Link>
            </Text>
            <Button text="I'm informed" onClick={() => acknowledgeIssue(issue)} />
          </SectionMessage>
        ))}
        <Heading size="small">Done</Heading>
        <Table>
          <Head>
            <Cell>
              <Text>Acknowledged Issue</Text>
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