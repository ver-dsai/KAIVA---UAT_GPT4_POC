import { Outlet, NavLink, Link } from "react-router-dom";

import github from "../../assets/github.svg";

import kaivalogo from "../../pages/Logos/KaivaLogo.png";

import Kuoklogo from "../../pages/Logos/KuokLogo.png";

import styles from "./Layout.module.css";

import { useLogin } from "../../authConfig";

import { LoginButton } from "../../components/LoginButton";

const Layout = () => {
    return (
        <div className={styles.layout}>
            <header className={styles.header} role={"banner"}>
                <div className={styles.headerContainer}>
                    <div className={styles.headerRightText}>
                        <div className={styles.logoContainer}>
                            <img src={Kuoklogo} alt="KAIVA" className={styles.githubLogo} />
                            <h6>Kuok Group Singapore</h6>
                        </div>
                        {/* <div className={styles.separator}>|</div> */}
                        <div>|</div>
                        <div className={styles.logoContainer}>
                            <img src={kaivalogo} alt="KAIVA" className={styles.kaivalogo} />
                            <h6>KAIVA</h6>
                        </div>
                    </div>
                    <Link to="/" className={styles.headerTitleContainer}>
                        {/* <h3 className={styles.headerTitle}>GPT + Enterprise data | Sample</h3> */}
                    </Link>
                    <nav>
                        <div className={styles.headerNavContainer}>
                            <ul className={styles.headerNavList}>
                                <li>
                                    <NavLink to="/" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                                        Chat
                                    </NavLink>
                                </li>
                                <li className={styles.headerNavLeftMargin}>
                                    <NavLink to="/qa" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                                        Ask a question
                                    </NavLink>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    {useLogin && <LoginButton />}
                </div>
            </header>

            <Outlet />
        </div>
    );
};

export default Layout;
