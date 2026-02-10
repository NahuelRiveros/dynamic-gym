import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../../auth/AuthContext";
export default function AppLayout({ children }) {
    const { usuario , logout} = useAuth();
    return (
        <div className="min-h-screen bg-gray-50">
        <Navbar usuario={usuario} onLogout={logout} />
            <main>{children}</main>
        <Footer />
        </div>
    );
}
