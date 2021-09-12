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
  Heading
} from '@forge/ui';
import api, { route } from '@forge/api';


const App = () => {
  const { accountId } = useProductContext();

  const [daciField, setDaciField] = useState(null);
  const [completedIssues, setCompletedIssues] = useState([]);

  const userAcknowledged = issue => issue.fields[daciField.id].some(user => user.accountId === accountId)

  const getDaciField = async () => {
    const response = await api.asApp().requestJira(route`/rest/api/3/field`);
    const fields = await response.json();
    const daciField = fields.find(field => field.name === 'DACI Informed List')
    setDaciField(daciField)
  }

  const getIssues = async () => {
    const response = await api.asApp().requestJira(route`/rest/api/3/search?fields=*all`);
    const { issues } = await response.json()
    const completedIssues = issues.filter(issue => issue.fields.status.name === 'Done')
    setCompletedIssues(completedIssues)
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
  }, [])

  const needsAcknowledgmentIssues = completedIssues.filter(issue => !userAcknowledged(issue))
  const acknowledgedIssues = completedIssues.filter(issue => userAcknowledged(issue))
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