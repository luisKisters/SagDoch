import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="h-1/6 bg-[#FF005C]">
        {" "}
        {/* Top Red Section */}
        {/* Content for top section can be added here if needed globally */}
      </div>
      <div className="flex-grow bg-[#0F0F1B] text-white">
        {" "}
        {/* Middle Dark Blue Section */}
        {children} {/* Page-specific content will go here */}
      </div>
      <div className="h-1/6 bg-[#00FFC6]">
        {" "}
        {/* Bottom Green Section */}
        {/* Content for bottom section can be added here if needed globally */}
      </div>
    </div>
  );
};

export default Layout;
