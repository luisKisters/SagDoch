# Scripts

This directory contains utility scripts for the SagDoch Truth or Dare app.

## generateQuestions.ts

AI-powered question generation using Google's Gemini API to create new questions for existing packs.

### Setup

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set the environment variable:
   ```bash
   export GOOGLE_API_KEY=your_api_key_here
   # or
   export GEMINI_API_KEY=your_api_key_here
   ```

### Usage

```bash
# Generate questions for a specific pack
tsx scripts/generateQuestions.ts --pack "Default Pack" --count 10

# Generate questions with specific type
tsx scripts/generateQuestions.ts --pack "Spicy (18+)" --type truth --count 5

# Generate questions with custom theme
tsx scripts/generateQuestions.ts --pack "Custom Pack" --theme "Gaming" --count 15

# Get help
tsx scripts/generateQuestions.ts --help
```

### Options

- `--pack <name>`: Target pack name (required)
- `--count <number>`: Number of questions to generate (default: 10)
- `--type <truth|dare>`: Question type (default: both)
- `--theme <string>`: Custom theme description
- `--targeting <percentage>`: Percentage of questions requiring targeting (default: 30)
- `--output <file>`: Output file path (default: questions\_[timestamp].json)

## generatePacks.ts

**NEW**: AI-powered pack generation using Google's Gemini API with structured output to create complete question packs.

### Features

- Uses Gemini 2.0 Flash with structured JSON output
- Generates complete packs with metadata and questions
- Support for targeting questions ({targetPlayerName})
- German language questions
- Configurable pack types and themes
- Command-line interface with multiple options

### Setup

Same as generateQuestions.ts - requires a Gemini API key.

### Usage

```bash
# List available predefined pack configurations
tsx scripts/generatePacks.ts --list

# Generate all predefined packs
tsx scripts/generatePacks.ts

# Generate a specific predefined pack
tsx scripts/generatePacks.ts --pack "Erwachsenen Edition"
tsx scripts/generatePacks.ts --pack 1

# Generate a custom pack
tsx scripts/generatePacks.ts --name "Gaming Pack" --theme "Video games and esports" --questions 20 --type truth_and_dare

# Generate with specific options
tsx scripts/generatePacks.ts --name "Adult Pack" --adult --questions 25 --target-percentage 40

# Custom output directory
tsx scripts/generatePacks.ts --output ./my-packs
```

### Predefined Pack Configurations

1. **Erwachsenen Edition** (Adult Edition)

   - 18+ content with intimate questions
   - 25 questions, 40% targeting

2. **Freunde für immer** (Friends Forever)

   - Friendship and shared memories
   - 20 questions, 35% targeting

3. **Wilde Nacht** (Wild Night)

   - Party themes and crazy challenges
   - 30 questions, 25% targeting

4. **Geheimnisse enthüllt** (Secrets Revealed)

   - Truth-only pack for deep conversations
   - 25 truth questions, 30% targeting

5. **Mutproben Chaos** (Dare Chaos)
   - Dare-only pack for action lovers
   - 20 dare questions, 40% targeting

### Custom Pack Options

- `--name <name>`: Custom pack name (required for custom packs)
- `--theme <theme>`: Pack theme/topic description
- `--description <desc>`: Pack description for UI
- `--adult`: Mark as 18+ pack
- `--questions <num>`: Number of questions (default: 20)
- `--type <type>`: Pack type (truth_and_dare, only_truth, only_dare)
- `--target-percentage <n>`: Percentage requiring targeting (default: 30)
- `--output, -o <dir>`: Output directory (default: ./generated-packs)

### Output Format

Generated packs are saved as JSON files with this structure:

```json
{
  "id": "pack-id",
  "name": "Pack Name",
  "description": "Pack description",
  "is_18_plus": false,
  "type": "truth_and_dare",
  "is_locked": true,
  "cost_in_ads": 5,
  "questions": [
    {
      "type": "truth",
      "text_template": "{playerName}, was ist dein größtes Geheimnis?",
      "requires_target": false
    },
    {
      "type": "dare",
      "text_template": "{playerName}, gib {targetPlayerName} ein Kompliment.",
      "requires_target": true
    }
  ]
}
```

### Integration with Database

To import generated packs into the app:

1. Copy the JSON files to your desired location
2. Update `lib/db.ts` to include the new pack metadata in `defaultPacks`
3. Add the questions to `defaultQuestions` with matching `pack_name`
4. Increment the database version to trigger an upgrade

### Advanced Features

- **Structured Output**: Uses Gemini's response schema to ensure consistent JSON format
- **Targeting Logic**: Automatically calculates question distribution
- **German Language**: All questions generated in German with proper grammar
- **Rate Limiting**: Built-in delays to avoid API rate limits
- **Error Handling**: Robust error handling with detailed logging
- **Flexible Configuration**: Support for custom themes and parameters

### API Usage Notes

- Requires Gemini 2.0 Flash model for structured output
- Uses response MIME type "application/json"
- Includes comprehensive prompts for quality German questions
- Handles targeting logic with {playerName} and {targetPlayerName} placeholders

### Examples

```bash
# Generate a gaming-themed pack
tsx scripts/generatePacks.ts \
  --name "Gaming Legends" \
  --theme "Video games, esports, gaming culture" \
  --description "Für echte Gamer und Esports-Fans" \
  --questions 30 \
  --target-percentage 25

# Generate an adult relationships pack
tsx scripts/generatePacks.ts \
  --name "Beziehungen Plus" \
  --theme "Intimate relationships, dating, love" \
  --adult \
  --questions 20 \
  --target-percentage 50 \
  --type truth_and_dare

# Generate only truth questions for deep conversations
tsx scripts/generatePacks.ts \
  --name "Tiefe Gedanken" \
  --theme "Philosophy, personal growth, deep thoughts" \
  --type only_truth \
  --questions 25 \
  --target-percentage 20
```

## Notes

- Both scripts generate German language content suitable for the app
- The targeting system supports the player attraction logic implemented in `lib/targeting.ts`
- Generated content follows the app's placeholder conventions (`{playerName}`, `{targetPlayerName}`)
- Questions are designed to work with the existing UI and game flow
- All generated packs default to `is_locked: true` for monetization purposes
