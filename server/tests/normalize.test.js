import { describe, expect, it } from "vitest";
import { cleanYoutubeTitleAndArtist, matchesTitleAndArtist } from "../src/utils/normalize.js";

describe("normalize utils", () => {
  describe("cleanYoutubeTitleAndArtist", () => {
    it("cleans brackets, feature tags, official tags, and parses Artist - Title correctly", () => {
      const res1 = cleanYoutubeTitleAndArtist(
        "The Weeknd - Blinding Lights (Official Video)",
        "TheWeekndVEVO"
      );
      expect(res1.title).toBe("Blinding Lights");
      expect(res1.artist).toBe("The Weeknd");

      const res2 = cleanYoutubeTitleAndArtist(
        "Blinding Lights (Lyrics)",
        "The Weeknd"
      );
      expect(res2.title).toBe("Blinding Lights");
      expect(res2.artist).toBe("The Weeknd");

      const res3 = cleanYoutubeTitleAndArtist(
        "Kesariya - Brahmastra | Ranbir | Alia | Pritam | Arijit | Amitabh",
        "Sony Music India"
      );
      expect(res3.title).toBe("Brahmastra");
      expect(res3.artist).toBe("Kesariya");

      const res4 = cleanYoutubeTitleAndArtist(
        "Ali Sethi & Shae Gill - Pasoori (Official Music Video)",
        "Coke Studio"
      );
      expect(res4.title).toBe("Pasoori");
      expect(res4.artist).toBe("Ali Sethi & Shae Gill");
    });
  });

  describe("matchesTitleAndArtist", () => {
    it("correctly matches candidates to target titles and artists, including label and word-overlap edge cases", () => {
      // Case 1: Exact matches / contains
      expect(
        matchesTitleAndArtist(
          "Blinding Lights",
          "The Weeknd",
          "The Weeknd - Blinding Lights (Official Video)",
          "TheWeekndVEVO"
        )
      ).toBe(true);

      // Case 2: Label uploads and word-overlap
      expect(
        matchesTitleAndArtist(
          "Kesariya",
          "Arijit Singh",
          "Kesariya (Video Song) - Brahmastra",
          "Sony Music India"
        )
      ).toBe(true);

      expect(
        matchesTitleAndArtist(
          "Pasoori",
          "Ali Sethi & Shae Gill",
          "Ali Sethi & Shae Gill - Pasoori (Official Music Video)",
          "Coke Studio"
        )
      ).toBe(true);

      // Case 3: False matches
      expect(
        matchesTitleAndArtist(
          "Blinding Lights",
          "The Weeknd",
          "Kesariya - Brahmastra | Ranbir | Alia | Pritam | Arijit | Amitabh",
          "Sony Music India"
        )
      ).toBe(false);
    });
  });
});
