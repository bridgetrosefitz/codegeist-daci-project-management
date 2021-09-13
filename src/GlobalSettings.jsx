import ForgeUI, {
  render,
  Fragment,
  Heading,
  Form,
  Select,
  Option,
  UserPicker,
  GlobalSettings,
  useEffect,
  useState,
} from '@forge/ui';
import api, { route, storage } from '@forge/api';

const App = () => {
  const [groups, setGroups] = useState([])
  const [projects, setProjects] = useState([])
  const [statuses, setStatuses] = useState({})
  const [settings, setSettings] = useState({
    groups: [],
    users: [],
    excludedUsers: [],
  })

  const getProjects = async () => {
    const response = await api.asApp().requestJira(route`/rest/api/3/project`);
    const projects = await response.json();
    let statusObj = {}
    await Promise.all(projects.map(async project => {
      const projectStatuses = await getProjectStatuses(project.id)
      const projectTask = projectStatuses.find(status => status.name === 'Task')
      statusObj = { ...statusObj, [project.id]: projectTask.statuses }
    }))
    await setStatuses(statusObj)
    setProjects(projects)
  }
  
  const getProjectStatuses = async (projectId) => {
    const response = await api.asApp().requestJira(route`/rest/api/3/project/${projectId}/statuses`);
    const projectStatuses = await response.json();
    return projectStatuses
  }

  const saveSettings = (settings) => {
    // removes 'project-' from form key since I can't use a number for name of field
    Object.entries(settings).forEach(([key]) => {
      if (key.includes('project-')) {
        const newKey = key.replace('project-', '')
        settings[newKey] = settings[key]
        delete settings[key]
      }
    })
    storage.set('daci-global-settings', settings);
    setSettings(settings)
  }

  const getSettings = async () => {
    const globalDaciSettings = await storage.get('daci-global-settings');
    setSettings(globalDaciSettings)
  }

  useEffect(async () => {
    const response = await api.asApp().requestConfluence(route`/wiki/rest/api/group`);
    const data = await response.json()
    await getSettings()
    await getProjects()
    setGroups(data.results)
  }, [])

  return (
    <Fragment>
      {groups.length > 0 && (
        <Form onSubmit={saveSettings} submitButtonText="Save">
          <Heading size='small'>Map projects to compeltion defintion</Heading>
          {projects.map(project => (
          <Fragment>
            <Select label={`${project.name} completion status`} name={`project-${project.id}`} description="Tell us what stats should kick off Informed">
              {statuses[project.id].map(status => {
                return (
                <Option
                  defaultSelected={settings[project.id] === status.id}
                  value={status.id}
                  label={status.name} />
              )})}
            </Select>
          </Fragment>
          ))}
          <Heading size='small'>Default groups and people to be Informed</Heading>
          <Select isMulti label="Groups" name="groups" description="hellloooo">
            {groups.map(group => (
              <Option
                defaultSelected={settings.groups.includes(group.name)}
                value={group.name}
                label={group.name} />
            ))}
          </Select>
          <UserPicker defaultValue={settings.users} isMulti label="Users" name="users" />
          <UserPicker defaultValue={settings.excludedUsers} isMulti label="Excluded Users" name="excludedUsers" />
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
