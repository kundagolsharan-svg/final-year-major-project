import { Auth3DWrapper } from "./_components/auth-3d-wrapper";

const AuthLayout = ({ children }) => {
  return (
    <Auth3DWrapper>
      {children}
    </Auth3DWrapper>
  );
};

export default AuthLayout;
