import ForgeUI, {
  render,
  Fragment,
  Text,
  Heading,
  Form,
  TextField,
  Select,
  Option,
  UserPicker,
  CheckboxGroup,
  Checkbox,
  GlobalSettings,
  useEffect,
  useState,
} from '@forge/ui';
import api, { route, storage } from '@forge/api';

const App = () => {
  const [groups, setGroups] = useState([])
  const [settings, setSettings] = useState({
    levelAtWhichDaciIsApplied: {
      project: true,
      issue: true
    },
    peopleRelatedToDaciFunctions: {
      driver: {
        groups: {

        },
        users: {

        }
      },
      approver: {
        groups: {

        },
        users: {

        }
      },
      contributor: {
        groups: {

        },
        users: {

        }
      },
      informed: {
        groups: {

        },
        users: {

        }
      },

    },
    typeOfEngagement: {
      driver: {
        watchIssue: true,
        beAssigneeOnIssue: false,
        bePersonOnIssue: true,
        receiveIssueEmailUpdates: true,
        receiveProjectEmailUpdates: true,
      },
      approver: {
        watchIssue: true,
        beAssigneeOnIssue: false,
        bePersonOnIssue: true,
        receiveIssueEmailUpdates: true,
        receiveProjectEmailUpdates: true,
      },
      contributor: {
        watchIssue: true,
        beAssigneeOnIssue: false,
        bePersonOnIssue: true,
        receiveIssueEmailUpdates: true,
        receiveProjectEmailUpdates: true,
      },
      informed: {
        watchIssue: true,
        beAssigneeOnIssue: false,
        bePersonOnIssue: true,
        receiveIssueEmailUpdates: true,
        receiveProjectEmailUpdates: true,
      }
    },

  })

  const saveSettings = (settings) => {
    storage.set('daci-global-settings', settings);
    setSettings(settings)
    console.log(settings)
  }

  const getSettings = async () => {
    const globalDaciSettings = await storage.get('daci-global-settings');
    console.log(globalDaciSettings)
    setSettings(globalDaciSettings)
  }

  useEffect(async () => {
    const response = await api.asApp().requestConfluence(route`/wiki/rest/api/group`);
    const data = await response.json()
    await getSettings()
    setGroups(data.results)
  }, [])

  return (
    <Fragment>
      <Heading size='medium'>Here are all the groups... motherfucker</Heading>
      {groups.length > 0 && (
        <Form onSubmit={saveSettings} submitButtonText="Save">
          {/* <CheckboxGroup name="groups" label="Groups">
            {groups.map(group => (
              <Checkbox
                defaultChecked={settings.groups.includes(group.id)}
                value={group.id}
                label={group.name} />
            ))}
          </CheckboxGroup> */}
          <Select isMulti label="Groups" name="groups" description="hellloooo">
            {groups.map(group => (
              <Option
                defaultSelected={settings.groups.includes(group.id)}
                value={group.id}
                label={group.name} />
            ))}
          </Select>
          <UserPicker defaultValue={settings.users} isMulti label="Users" name="users" />
        </Form>
      )}
    </Fragment>
  );
};

export default render(
  <GlobalSettings>
    <App />
  </GlobalSettings>
);
