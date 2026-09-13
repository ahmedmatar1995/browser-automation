import { OrganizationSwitcher, UserButton } from '@clerk/tanstack-react-start'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from './ui/sidebar'

export function AppSidebar() {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-(--line) bg-(--surface) backdrop-blur-2xl shadow-[3px_0_16px_rgba(23,58,64,0.06)] dark:shadow-[3px_0_16px_rgba(0,0,0,0.28)]"
    >
      <SidebarHeader className="flex-row items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
        <OrganizationSwitcher
          afterCreateOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
          afterLeaveOrganizationUrl="/"
          hidePersonal
          appearance={{
            elements: {
              rootBox: 'min-w-0! group-data-[collapsible=icon]:hidden!',
              organizationSwitcherTrigger: 'w-full! justify-between!',
            },
          }}
        />
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent className="py-6">items list</SidebarContent>
      <SidebarFooter className="p-2 group-data-[collapsible=icon]:items-center">
        <UserButton
          appearance={{
            elements: {
              rootBox: 'w-full',
              userButtonTrigger:
                'w-full justify-start group-data-[collapsible=icon]:justify-center',
              userButtonOuterIdentifier: 'group-data-[collapsible=icon]:hidden',
            },
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
