"use client";
import Layout from "@/components/Layout";
import Link from "next/link"; // Import Link for navigation
import { useEffect, useState } from "react"; // For "Kommt bald!" message

export default function Home() {
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleIchHabNochNieClick = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000); // Hide after 3 seconds
  };

  // Temporary DB test (can be removed after verification)
  // useEffect(() => {
  //   async function initDB() {
  //     try {
  //       const { getDB, addPlayer, getAllPlayers, getRandomQuestion } = await import('@/lib/db');
  //       const dbInstance = await getDB();
  //       console.log("Database instance:", dbInstance);

  //       // const newP = await addPlayer({name: "Luis", gender: "m", sexuality: "h"});
  //       // console.log("Added player:", newP);
  //       // const allP = await getAllPlayers();
  //       // console.log("All players:", allP);
  //       // const randomT = await getRandomQuestion("Default Pack", "truth");
  //       // console.log("Random Truth:", randomT);
  //       // const randomD = await getRandomQuestion("Default Pack", "dare");
  //       // console.log("Random Dare:", randomD);

  //     } catch (error) {
  //       console.error("Failed to initialize or test DB:", error);
  //     }
  //   }
  //   initDB();
  // }, []);

  return (
    <Layout>
      {/* The Layout component itself provides the colored sections. We need to place content within them or structure this page to map to them. */}
      {/* For this screen, content is primarily in the middle, with clickable areas potentially spanning or being specifically in those sections. */}
      {/* Assuming Layout children are rendered in the middle blue section by default. */}
      <div className="flex flex-col items-center justify-around flex-grow text-white relative">
        {/* This div will try to use the space of the middle blue section provided by Layout */}

        {/* Combined Clickable Area for "Wahrheit oder Pflicht" & "Wähle" -> /setup/players */}
        {/* We can make the entire upper part of the middle section clickable, or have specific text elements */}
        {/* For simplicity, let's make the text elements themselves part of the navigation link. */}
        {/* The PRD says "Top Red Area: Text 'Wahrheit oder Pflicht'" and "Middle Dark Blue Area: Clickable Text 'Wähle'" */}
        {/* This implies these texts might live *within* the colored sections of the Layout, not just the children part. */}
        {/* Let's adjust Layout or make this page structure more explicit. */}
        {/* For now, let's assume content needs to be absolutely positioned or placed within the Layout's structure more directly. */}
        {/* Given the Layout structure (divs for each color), we can't easily make one Link span two. */}
        {/* Re-interpreting: Wahrh/Pflicht is a title in Red. Wähle is clickable in Blue. They BOTH lead to /setup/players */}
        {/* This is still tricky with the current Layout. */}
        {/* Alternative: The Layout component is just for the background colors. This page then structures its content ON TOP. */}
        {/* Let's try making the Layout component allow passing components for each section, or this page rebuilds a similar structure. */}

        {/* Simplified Approach: Place elements and style them to appear in the respective areas. */}
        {/* The Layout children are in the blue middle. We need to add text to red (top) and green (bottom) specifically. */}
        {/* This would require modifying the Layout component to accept props for top/bottom content. */}

        {/* Let's assume the `Layout` component is already handling the sections, and we place clickable text: */}
        {/* Top Red section would be handled by Layout. We need to ensure it has the text. */}
        {/* For this iteration, let's put all interactive elements in the children part of the Layout (middle blue) */}
        {/* and style them to appear as if they are in those sections if needed, or simply make them large. */}

        <Link
          href="/setup/players"
          className="flex flex-col items-center justify-center text-center p-8 w-full flex-grow"
        >
          {/* This Link will effectively cover a large portion of the middle (blue) section */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 text-4xl md:text-5xl font-bold text-white cursor-pointer">
            Wahrheit oder Pflicht
          </div>
          <div className="text-6xl md:text-8xl font-bold text-white cursor-pointer">
            Wähle
          </div>
        </Link>

        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-4xl md:text-5xl font-bold text-white cursor-pointer p-4"
          onClick={handleIchHabNochNieClick}
        >
          Ich hab noch nie
        </div>

        {showComingSoon && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white p-3 rounded-md shadow-lg z-10">
            Kommt bald!
          </div>
        )}
      </div>
    </Layout>
  );
}
