import ForgeUI, {
  render,
  Fragment,
  Text,
  Link,
  HomepageFeed,
  useEffect,
  useState,
  Button,
  useProductContext,
  Tabs,
  Tab,
} from '@forge/ui';
import api, { route, storage } from '@forge/api';


const App = () => {
  const { accountId } = useProductContext();

  const [daciField, setDaciField] = useState(null);
  const [completedIssues, setCompletedIssues] = useState([]);
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

  const userAcknowledged = issue => issue.fields[daciField.id].some(user => user.accountId === accountId)
  
  const getSettings = async () => {
    const globalDaciSettings = await storage.get('daci-global-settings');
    return globalDaciSettings
  }

  const getDaciField = async () => {
    const response = await api.asApp().requestJira(route`/rest/api/3/field`);
    const fields = await response.json();
    const daciField = fields.find(field => field.name === 'DACI Informed List')
    setDaciField(daciField)
  }

  const getIssues = async () => {
    const response = await api.asApp().requestJira(route`/rest/api/3/search?fields=*all`);
    const { issues } = await response.json()
    const settings = await getSettings()
    const completedIssues = issues.filter(issue => issue.fields.status.id === settings.informed[issue.fields.project.id])
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
    const informedUsers = issue.fields[daciField.id] || [];
    if (!userAcknowledged(issue)) {
      await api.asApp().requestJira(route`/rest/api/3/app/field/${daciField.id}/value`, {
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
  
  useEffect(async () => {
    await getDaciField()
    await getIssues()
    await getUserGroups()
  }, [])

  const partOfInformedGlobalGroup = () => userGroups.some(userGroup => settings.informed.groups.includes(userGroup))
  const partOfInformedUserGlobalGroup = () =>  settings.informed.users.includes(accountId)
  const partOfInformedExcludeUserGlobalGroup = () => settings.informed.excludedUsers.includes(accountId)
  const globalPermissions = () => (partOfInformedGlobalGroup() || partOfInformedUserGlobalGroup()) && !partOfInformedExcludeUserGlobalGroup()

  const needsAcknowledgmentIssues = completedIssues.filter(issue => !userAcknowledged(issue) && globalPermissions())
  const acknowledgedIssues = completedIssues.filter(issue => userAcknowledged(issue) && globalPermissions())
  const needsAcknowledgmentCount = needsAcknowledgmentIssues.length > 0 ? ` (${needsAcknowledgmentIssues.length})` : ''
  return (
    <Tabs>
      <Tab label={`Need to be informed${needsAcknowledgmentCount}`}>
        {needsAcknowledgmentIssues.length === 0 && (
          <Text>CONGRATS! YOU'RE TOTALLY INFORMED!</Text>
        )}
        {needsAcknowledgmentIssues.map(issue => (
          <Fragment>
            <Text>
              <Link href={`/browse/${issue.key}`}>{issue.fields.summary}</Link>
            </Text>
            <Button text="I'm informed" onClick={() => acknowledgeIssue(issue)} />
          </Fragment>
        ))}
      </Tab>
      <Tab label="Informed">
        {acknowledgedIssues.map(issue => (
          <Text>
            <Link href={`/browse/${issue.key}`}>{issue.fields.summary}</Link>
          </Text>
        ))}
      </Tab>
    </Tabs>
  )
};

export default render(
  <HomepageFeed>
    <App />
  </HomepageFeed>
);