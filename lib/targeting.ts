import { Player } from "./db";

/**
 * Determines valid target players based on the current player's gender and sexuality.
 *
 * Targeting Logic:
 * - Hetero: Attracted to different genders (Male→Female/Divers, Female→Male/Divers, Divers→Male/Female)
 * - Homo: Attracted to same gender (Male→Male, Female→Female, Divers→Divers)
 * - Bi: Attracted to Male and Female (excludes Divers to represent traditional bisexuality)
 * - Pan: Attracted to all genders (Male, Female, Divers)
 * - Ace: Romantic attractions possible, allows all targets for game purposes
 *
 * @param currentPlayer The player whose targets we're determining
 * @param allPlayers All available players in the game
 * @returns Array of valid target players based on attraction logic
 */
export function getTargetPlayers(
  currentPlayer: Player,
  allPlayers: Player[]
): Player[] {
  // Remove the current player from potential targets
  const otherPlayers = allPlayers.filter((p) => p.id !== currentPlayer.id);

  // Return targets based on sexuality
  switch (currentPlayer.sexuality) {
    case "Hetero":
      // Attracted to genders different from their own
      return otherPlayers.filter((p) => {
        if (currentPlayer.gender === "Männlich") {
          return p.gender === "Weiblich" || p.gender === "Divers";
        } else if (currentPlayer.gender === "Weiblich") {
          return p.gender === "Männlich" || p.gender === "Divers";
        } else {
          // Divers - attracted to binary genders (traditional heterosexual attraction)
          return p.gender === "Männlich" || p.gender === "Weiblich";
        }
      });

    case "Homo":
      // Attracted to same or similar gender
      return otherPlayers.filter((p) => {
        if (currentPlayer.gender === "Divers") {
          // Divers players can be attracted to other Divers players
          return p.gender === "Divers";
        } else {
          // Traditional same-gender attraction
          return p.gender === currentPlayer.gender;
        }
      });

    case "Bi":
      // Attracted to multiple genders, typically male and female
      return otherPlayers.filter((p) => {
        // Bi typically refers to attraction to male and female
        return p.gender === "Männlich" || p.gender === "Weiblich";
      });

    case "Pan":
      // Attracted to all genders regardless of gender identity
      return otherPlayers;

    case "Ace":
      // Asexual - may still have romantic attractions, but for game purposes
      // we'll allow romantic/relationship-based targeting with reduced frequency
      // For now, allowing all targets but the game logic could filter question types
      return otherPlayers;

    // Handle legacy sexuality options for backward compatibility
    case "Heterosexuell":
      return otherPlayers.filter((p) => {
        if (currentPlayer.gender === "Männlich") {
          return p.gender === "Weiblich" || p.gender === "Divers";
        } else if (currentPlayer.gender === "Weiblich") {
          return p.gender === "Männlich" || p.gender === "Divers";
        } else {
          return p.gender === "Männlich" || p.gender === "Weiblich";
        }
      });

    case "Homosexuell":
      return otherPlayers.filter((p) => p.gender === currentPlayer.gender);

    case "Bisexuell":
      return otherPlayers.filter((p) => {
        return p.gender === "Männlich" || p.gender === "Weiblich";
      });

    case "Pansexuell":
      return otherPlayers;

    case "Asexuell":
      return otherPlayers;

    default:
      console.warn(
        `Unknown sexuality: ${currentPlayer.sexuality}, defaulting to all targets`
      );
      return otherPlayers;
  }
}

/**
 * Gets a random target player from the list of valid targets.
 * @param currentPlayer The player whose target we're selecting
 * @param allPlayers All available players in the game
 * @returns A randomly selected target player or undefined if no valid targets
 */
export function getRandomTargetPlayer(
  currentPlayer: Player,
  allPlayers: Player[],
  recentTargetIds: number[] = []
): Player | undefined {
  let validTargets = getTargetPlayers(currentPlayer, allPlayers);

  // Attempt to filter out recent targets, but only if there are other options
  if (validTargets.length > 1) {
    const nonRecentTargets = validTargets.filter(
      (p) => !recentTargetIds.includes(p.id!)
    );
    if (nonRecentTargets.length > 0) {
      validTargets = nonRecentTargets;
    }
  }

  if (validTargets.length === 0) {
    console.log(
      `No valid targets found for ${currentPlayer.name} (${currentPlayer.gender}, ${currentPlayer.sexuality})`
    );
    return undefined;
  }

  const randomIndex = Math.floor(Math.random() * validTargets.length);
  const selectedTarget = validTargets[randomIndex];

  console.log(
    `Targeting: ${currentPlayer.name} (${currentPlayer.gender}, ${currentPlayer.sexuality}) → ${selectedTarget.name} (${selectedTarget.gender}, ${selectedTarget.sexuality})`
  );

  return selectedTarget;
}

/**
 * Debug function to log targeting logic for all players
 * @param allPlayers All players in the game
 */
export function debugTargetingLogic(allPlayers: Player[]): void {
  console.log("=== Targeting Logic Debug ===");

  allPlayers.forEach((player) => {
    const targets = getTargetPlayers(player, allPlayers);
    console.log(
      `${player.name} (${player.gender}, ${player.sexuality}) can target:`,
      targets.map((t) => `${t.name} (${t.gender})`).join(", ") || "No one"
    );
  });

  console.log("=== End Targeting Debug ===");
}
