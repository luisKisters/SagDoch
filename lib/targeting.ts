import { Player } from "./db";

/**
 * Determines valid target players based on the current player's gender and sexuality.
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
    case "Heterosexuell":
      // Attracted to the opposite gender
      return otherPlayers.filter((p) => {
        if (currentPlayer.gender === "Männlich") {
          return p.gender === "Weiblich" || p.gender === "Divers";
        } else if (currentPlayer.gender === "Weiblich") {
          return p.gender === "Männlich" || p.gender === "Divers";
        } else {
          // Divers
          return p.gender === "Männlich" || p.gender === "Weiblich";
        }
      });

    case "Homosexuell":
      // Attracted to the same gender
      return otherPlayers.filter((p) => p.gender === currentPlayer.gender);

    case "Bisexuell":
    case "Pansexuell":
      // Attracted to all genders
      return otherPlayers;

    case "Asexuell":
      // Attracted to no one
      return [];

    // Handle legacy sexuality options for backward compatibility
    case "Hetero":
      // Same logic as Heterosexuell
      return otherPlayers.filter((p) => {
        if (currentPlayer.gender === "Männlich") {
          return p.gender === "Weiblich" || p.gender === "Divers";
        } else if (currentPlayer.gender === "Weiblich") {
          return p.gender === "Männlich" || p.gender === "Divers";
        } else {
          // Divers
          return p.gender === "Männlich" || p.gender === "Weiblich";
        }
      });

    case "Andere":
      // Default to all targets for backward compatibility
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
  allPlayers: Player[]
): Player | undefined {
  const validTargets = getTargetPlayers(currentPlayer, allPlayers);

  if (validTargets.length === 0) {
    return undefined;
  }

  const randomIndex = Math.floor(Math.random() * validTargets.length);
  return validTargets[randomIndex];
}
