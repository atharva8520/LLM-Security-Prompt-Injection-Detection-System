import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = ({ children }) => {
    return (
        <div className="flex bg-bg min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar />
                <main className="flex-1 ml-60 overflow-auto relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
