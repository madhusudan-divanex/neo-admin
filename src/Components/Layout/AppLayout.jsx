import { Outlet, useLocation} from "react-router-dom"
import LeftSidebar from "./LeftSidebar"
import TopHeader from "./TopHeader"


function AppLayout() {
  const location = useLocation();
  const path = location.pathname;
  const staticRoute = ['/login']
 
  return (
    <>
      <div className="all-tp-main-section">
        {!staticRoute.includes(path) && < LeftSidebar />}
        <div className="dashboard-right-side flex-grow-1 d-flex flex-column">
           {!staticRoute.includes(path) && <TopHeader />}
          <Outlet />
        </div>
      </div>
    </>
  )
}

export default AppLayout