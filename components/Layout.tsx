import React from "react";

interface LayoutProps {
  children?: React.ReactNode;
  topSectionContent?: React.ReactNode;
  bottomSectionContent?: React.ReactNode;
  mainClassName?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  topSectionContent,
  bottomSectionContent,
  mainClassName,
}) => {
  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <header className="h-[43.75%] bg-[#FF005C] flex items-center justify-center p-2 relative shrink-0">
        {topSectionContent}
      </header>
      <main
        className={`h-[12.5%] bg-[#0F0F1B] flex flex-col items-center justify-center p-2 relative shrink-0 ${
          mainClassName || ""
        }`}
      >
        {children}
      </main>
      <footer className="h-[43.75%] bg-[#00FFC6] flex items-center justify-center p-2 relative shrink-0">
        {bottomSectionContent}
      </footer>
    </div>
  );
};

export default Layout;
