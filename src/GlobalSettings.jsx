import ForgeUI, {
  render,
  Fragment,
  Heading,
  Strong,
  Form,
  Select,
  Option,
  UserPicker,
  GlobalSettings,
  useEffect,
  useState,
  Text,
  Em
} from '@forge/ui';
import api, { route, storage } from '@forge/api';

const App = () => {
  const [groups, setGroups] = useState([])
  const [projects, setProjects] = useState([])
  const [statuses, setStatuses] = useState({})
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
    settings.informed.groups = settings.informed.groups.map(group => group.value)
    settings.informed.users = settings.informed.users.map(user => user.id)
    settings.informed.excludedUsers = settings.informed.excludedUsers.map(user => user.id)
    // removes 'project-' from form key since I can't use a number for name of field
    Object.entries(settings.informed).forEach(([key]) => {
      if (key.includes('project-')) {
        const newKey = key.replace('project-', '')
        settings.informed[newKey] = settings.informed[key].value
        delete settings.informed[key]
      }
    })
    settings.contributor.groups = settings.contributor.groups.map(group => group.value)
    settings.contributor.users = settings.contributor.users.map(user => user.id)
    settings.contributor.excludedUsers = settings.contributor.excludedUsers.map(user => user.id)
    // removes 'project-' from form key since I can't use a number for name of field
    Object.entries(settings.contributor).forEach(([key]) => {
      if (key.includes('project-')) {
        const newKey = key.replace('project-', '')
        settings.contributor[newKey] = settings.contributor[key].value
        delete settings.contributor[key]
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
          <Text>Specify which groups or users should be designated as <Strong>Contributor</Strong> and <Strong>Informed</Strong>, and when actions should be generated.</Text>
          <Text>By default, an issue's assignee is designated as its <Strong>Driver</Strong>, and all users can view <Strong>Approver</Strong> health stats.</Text>
          <Text>
            {'———'}
          </Text>
          <Heading size='medium'>Contributor settings</Heading>
          <Text><Strong>Groups and users</Strong></Text>
          <Text>Choose which groups and users should be designated as <Strong>Contributor</Strong> to receive actions.</Text>
          <Text>You can choose to exclude specific users, which overrides settings inherited from any groups that user belongs to.</Text>
          <Text>This setting will be applied for issues in all projects.</Text>
          <Select isMulti label="Groups" name="contributor[groups]" description="Select groups">
            {groups.map(group => (
              <Option
                defaultSelected={settings.contributor.groups.includes(group.name)}
                value={group.name}
                label={group.name} />
            ))}
          </Select>
          <UserPicker defaultValue={settings.contributor.users} isMulti label="Users" name="contributor[users]" description="Select users"/>
          <UserPicker defaultValue={settings.contributor.excludedUsers} isMulti label="Excluded Users" name="contributor[excludedUsers]" description="Select users"/>
          <Text><Strong>Status to generate action</Strong></Text>
          <Text>For each project, choose from available issue statuses to specify when an action should be generated for the <Strong>Contributor</Strong>.</Text>
          <Text><Strong>E.g.</Strong> when an issue is moved into "Needs Review", an action will appear in the DACI Action Panel for all Contributors to that issue.</Text>
          {projects.map(project => (
            <Fragment>
              <Select label={`Project name: ${project.name}`} name={`contributor[project-${project.id}]`} description="Select a status">
                {statuses[project.id].map(status => {
                  return (
                    <Option
                      defaultSelected={settings.contributor[project.id] === status.id}
                      value={status.id}
                      label={status.name} />
                  )
                })}
              </Select>
            </Fragment>
          ))}
          <Text>
            {'———'}
          </Text>
          <Heading size='medium'>Informed settings</Heading>
          <Text><Strong>Groups and users</Strong></Text>
          <Text>Choose which groups and users should be designated as <Strong>Informed</Strong> to receive actions.</Text>
          <Text>You can choose to exclude specific users, which overrides settings inherited from any groups that user belongs to.</Text>
          <Text>This setting will be applied for issues in all projects.</Text>
          <Select isMulti label="Groups" name="informed[groups]" description="Select groups">
            {groups.map(group => (
              <Option
                defaultSelected={settings.informed.groups.includes(group.name)}
                value={group.name}
                label={group.name} />
            ))}
          </Select>
          <UserPicker defaultValue={settings.informed.users} isMulti label="Users" name="informed[users]" description="Select users"/>
          <UserPicker defaultValue={settings.informed.excludedUsers} isMulti label="Excluded Users" name="informed[excludedUsers]" description="Select users"/>
          <Text><Strong>Status to generate action</Strong></Text>
          <Text>For each project, choose from available issue statuses to specify when an action should be generated for <Strong>Informed</Strong> users.</Text>
          <Text><Strong>E.g.</Strong> when an issue is moved into "Done", an action will appear in the DACI Action Panel for all who are Informed on that issue.</Text>
          {projects.map(project => (
            <Fragment>
              <Select label={`Project name: ${project.name}`} name={`informed[project-${project.id}]`} description="Select a status">
                {statuses[project.id].map(status => {
                  return (
                    <Option
                      defaultSelected={settings.informed[project.id] === status.id}
                      value={status.id}
                      label={status.name} />
                  )
                })}
              </Select>
            </Fragment>
          ))}
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
