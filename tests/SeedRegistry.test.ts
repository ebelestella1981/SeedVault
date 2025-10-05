import { describe, it, expect, beforeEach } from "vitest";
import { buffCV, listCV, stringAsciiCV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_HASH = 101;
const ERR_INVALID_TITLE = 102;
const ERR_INVALID_DESCRIPTION = 103;
const ERR_INVALID_ORIGIN = 104;
const ERR_INVALID_CATEGORY = 105;
const ERR_VARIETY_ALREADY_EXISTS = 106;
const ERR_VARIETY_NOT_FOUND = 107;
const ERR_INVALID_CLIMATE = 110;
const ERR_INVALID_YIELD = 111;
const ERR_MAX_VARIETIES_EXCEEDED = 114;
const ERR_INVALID_UPDATE_PARAM = 113;
const ERR_AUTHORITY_NOT_VERIFIED = 109;
const ERR_INVALID_TRAITS = 115;
const ERR_INVALID_RESISTANCE = 116;
const ERR_INVALID_MATURITY = 117;
const ERR_INVALID_LOCATION = 118;

interface Variety {
  hash: Uint8Array;
  title: string;
  description: string;
  origin: string;
  category: string;
  climate: string;
  yieldPotential: number;
  traits: string[];
  resistance: string;
  maturityDays: number;
  timestamp: number;
  creator: string;
  location: string;
  status: boolean;
}

interface VarietyUpdate {
  updateTitle: string;
  updateDescription: string;
  updateTimestamp: number;
  updater: string;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class SeedRegistryMock {
  state: {
    nextVarietyId: number;
    maxVarieties: number;
    registrationFee: number;
    authorityContract: string | null;
    varieties: Map<number, Variety>;
    varietyUpdates: Map<number, VarietyUpdate>;
    varietiesByHash: Map<string, number>;
  } = {
    nextVarietyId: 0,
    maxVarieties: 10000,
    registrationFee: 500,
    authorityContract: null,
    varieties: new Map(),
    varietyUpdates: new Map(),
    varietiesByHash: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";
  authorities: Set<string> = new Set(["ST1TEST"]);
  stxTransfers: Array<{ amount: number; from: string; to: string | null }> = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextVarietyId: 0,
      maxVarieties: 10000,
      registrationFee: 500,
      authorityContract: null,
      varieties: new Map(),
      varietyUpdates: new Map(),
      varietiesByHash: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
    this.authorities = new Set(["ST1TEST"]);
    this.stxTransfers = [];
  }

  isVerifiedAuthority(principal: string): Result<boolean> {
    return { ok: true, value: this.authorities.has(principal) };
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  setRegistrationFee(newFee: number): Result<boolean> {
    if (!this.state.authorityContract) return { ok: false, value: false };
    this.state.registrationFee = newFee;
    return { ok: true, value: true };
  }

  registerVariety(
    seedHash: Uint8Array,
    title: string,
    description: string,
    origin: string,
    category: string,
    climate: string,
    yieldPotential: number,
    traits: string[],
    resistance: string,
    maturityDays: number,
    location: string
  ): Result<number> {
    if (this.state.nextVarietyId >= this.state.maxVarieties) return { ok: false, value: ERR_MAX_VARIETIES_EXCEEDED };
    if (seedHash.length !== 32) return { ok: false, value: ERR_INVALID_HASH };
    if (!title || title.length > 100) return { ok: false, value: ERR_INVALID_TITLE };
    if (description.length > 500) return { ok: false, value: ERR_INVALID_DESCRIPTION };
    if (origin.length > 100) return { ok: false, value: ERR_INVALID_ORIGIN };
    if (!["vegetable", "fruit", "grain", "herb"].includes(category)) return { ok: false, value: ERR_INVALID_CATEGORY };
    if (!["tropical", "temperate", "arid", "cold"].includes(climate)) return { ok: false, value: ERR_INVALID_CLIMATE };
    if (yieldPotential <= 0) return { ok: false, value: ERR_INVALID_YIELD };
    if (traits.length > 10) return { ok: false, value: ERR_INVALID_TRAITS };
    if (resistance.length > 100) return { ok: false, value: ERR_INVALID_RESISTANCE };
    if (maturityDays <= 0 || maturityDays > 365) return { ok: false, value: ERR_INVALID_MATURITY };
    if (location.length > 100) return { ok: false, value: ERR_INVALID_LOCATION };
    if (!this.isVerifiedAuthority(this.caller).value) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const hashKey = seedHash.toString();
    if (this.state.varietiesByHash.has(hashKey)) return { ok: false, value: ERR_VARIETY_ALREADY_EXISTS };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };

    this.stxTransfers.push({ amount: this.state.registrationFee, from: this.caller, to: this.state.authorityContract });

    const id = this.state.nextVarietyId;
    const variety: Variety = {
      hash: seedHash,
      title,
      description,
      origin,
      category,
      climate,
      yieldPotential,
      traits,
      resistance,
      maturityDays,
      timestamp: this.blockHeight,
      creator: this.caller,
      location,
      status: true,
    };
    this.state.varieties.set(id, variety);
    this.state.varietiesByHash.set(hashKey, id);
    this.state.nextVarietyId++;
    return { ok: true, value: id };
  }

  getVariety(id: number): Variety | null {
    return this.state.varieties.get(id) || null;
  }

  updateVariety(id: number, updateTitle: string, updateDescription: string): Result<boolean> {
    const variety = this.state.varieties.get(id);
    if (!variety) return { ok: false, value: false };
    if (variety.creator !== this.caller) return { ok: false, value: false };
    if (!updateTitle || updateTitle.length > 100) return { ok: false, value: false };
    if (updateDescription.length > 500) return { ok: false, value: false };

    const updated: Variety = {
      ...variety,
      title: updateTitle,
      description: updateDescription,
      timestamp: this.blockHeight,
    };
    this.state.varieties.set(id, updated);
    this.state.varietyUpdates.set(id, {
      updateTitle,
      updateDescription,
      updateTimestamp: this.blockHeight,
      updater: this.caller,
    });
    return { ok: true, value: true };
  }

  getVarietyCount(): Result<number> {
    return { ok: true, value: this.state.nextVarietyId };
  }

  checkVarietyExistence(seedHash: Uint8Array): Result<boolean> {
    return { ok: true, value: this.state.varietiesByHash.has(seedHash.toString()) };
  }
}

describe("SeedRegistry", () => {
  let contract: SeedRegistryMock;

  beforeEach(() => {
    contract = new SeedRegistryMock();
    contract.reset();
  });

  it("registers a variety successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const seedHash = new Uint8Array(32).fill(1);
    const result = contract.registerVariety(
      seedHash,
      "Tomato Heritage",
      "Red juicy tomatoes",
      "Italy",
      "vegetable",
      "temperate",
      500,
      ["drought-resistant"],
      "pest-resistant",
      90,
      "Farm A"
    );
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);

    const variety = contract.getVariety(0);
    expect(variety?.title).toBe("Tomato Heritage");
    expect(variety?.description).toBe("Red juicy tomatoes");
    expect(variety?.origin).toBe("Italy");
    expect(variety?.category).toBe("vegetable");
    expect(variety?.climate).toBe("temperate");
    expect(variety?.yieldPotential).toBe(500);
    expect(variety?.traits).toEqual(["drought-resistant"]);
    expect(variety?.resistance).toBe("pest-resistant");
    expect(variety?.maturityDays).toBe(90);
    expect(variety?.location).toBe("Farm A");
    expect(contract.stxTransfers).toEqual([{ amount: 500, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects duplicate variety hashes", () => {
    contract.setAuthorityContract("ST2TEST");
    const seedHash = new Uint8Array(32).fill(1);
    contract.registerVariety(
      seedHash,
      "Tomato Heritage",
      "Red juicy tomatoes",
      "Italy",
      "vegetable",
      "temperate",
      500,
      ["drought-resistant"],
      "pest-resistant",
      90,
      "Farm A"
    );
    const result = contract.registerVariety(
      seedHash,
      "Another Tomato",
      "Different desc",
      "Spain",
      "fruit",
      "arid",
      600,
      ["heat-tolerant"],
      "disease-resistant",
      80,
      "Farm B"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_VARIETY_ALREADY_EXISTS);
  });

  it("rejects non-authorized caller", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.caller = "ST2FAKE";
    contract.authorities = new Set();
    const seedHash = new Uint8Array(32).fill(2);
    const result = contract.registerVariety(
      seedHash,
      "Corn Variety",
      "Yellow corn",
      "USA",
      "grain",
      "temperate",
      1000,
      ["high-yield"],
      "insect-resistant",
      120,
      "Field C"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_NOT_AUTHORIZED);
  });

  it("rejects registration without authority contract", () => {
    const seedHash = new Uint8Array(32).fill(3);
    const result = contract.registerVariety(
      seedHash,
      "NoAuth Variety",
      "Desc",
      "Origin",
      "vegetable",
      "tropical",
      300,
      [],
      "res",
      60,
      "Loc"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });

  it("rejects invalid hash length", () => {
    contract.setAuthorityContract("ST2TEST");
    const seedHash = new Uint8Array(31).fill(4);
    const result = contract.registerVariety(
      seedHash,
      "Invalid Hash",
      "Desc",
      "Origin",
      "fruit",
      "cold",
      400,
      ["trait"],
      "res",
      100,
      "Loc"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_HASH);
  });

  it("rejects invalid category", () => {
    contract.setAuthorityContract("ST2TEST");
    const seedHash = new Uint8Array(32).fill(5);
    const result = contract.registerVariety(
      seedHash,
      "Invalid Cat",
      "Desc",
      "Origin",
      "invalid",
      "arid",
      200,
      [],
      "res",
      70,
      "Loc"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_CATEGORY);
  });

  it("updates a variety successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const seedHash = new Uint8Array(32).fill(6);
    contract.registerVariety(
      seedHash,
      "Old Title",
      "Old Desc",
      "Origin",
      "herb",
      "temperate",
      150,
      ["aromatic"],
      "fungal-resistant",
      45,
      "Garden D"
    );
    const result = contract.updateVariety(0, "New Title", "New Desc");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const variety = contract.getVariety(0);
    expect(variety?.title).toBe("New Title");
    expect(variety?.description).toBe("New Desc");
    const update = contract.state.varietyUpdates.get(0);
    expect(update?.updateTitle).toBe("New Title");
    expect(update?.updateDescription).toBe("New Desc");
    expect(update?.updater).toBe("ST1TEST");
  });

  it("rejects update for non-existent variety", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.updateVariety(99, "New Title", "New Desc");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("rejects update by non-creator", () => {
    contract.setAuthorityContract("ST2TEST");
    const seedHash = new Uint8Array(32).fill(7);
    contract.registerVariety(
      seedHash,
      "Test Variety",
      "Desc",
      "Origin",
      "grain",
      "cold",
      800,
      ["cold-tolerant"],
      "virus-resistant",
      150,
      "Field E"
    );
    contract.caller = "ST3FAKE";
    const result = contract.updateVariety(0, "New Title", "New Desc");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("sets registration fee successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.setRegistrationFee(1000);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.registrationFee).toBe(1000);
    const seedHash = new Uint8Array(32).fill(8);
    contract.registerVariety(
      seedHash,
      "Fee Test",
      "Desc",
      "Origin",
      "vegetable",
      "tropical",
      300,
      [],
      "res",
      60,
      "Loc"
    );
    expect(contract.stxTransfers).toEqual([{ amount: 1000, from: "ST1TEST", to: "ST2TEST" }]);
  });

  it("rejects registration fee change without authority contract", () => {
    const result = contract.setRegistrationFee(1000);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });

  it("returns correct variety count", () => {
    contract.setAuthorityContract("ST2TEST");
    const seedHash1 = new Uint8Array(32).fill(9);
    contract.registerVariety(
      seedHash1,
      "Variety1",
      "Desc1",
      "Origin1",
      "fruit",
      "arid",
      400,
      ["trait1"],
      "res1",
      80,
      "Loc1"
    );
    const seedHash2 = new Uint8Array(32).fill(10);
    contract.registerVariety(
      seedHash2,
      "Variety2",
      "Desc2",
      "Origin2",
      "herb",
      "temperate",
      200,
      ["trait2"],
      "res2",
      50,
      "Loc2"
    );
    const result = contract.getVarietyCount();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(2);
  });

  it("checks variety existence correctly", () => {
    contract.setAuthorityContract("ST2TEST");
    const seedHash = new Uint8Array(32).fill(11);
    contract.registerVariety(
      seedHash,
      "Exist Test",
      "Desc",
      "Origin",
      "grain",
      "cold",
      600,
      [],
      "res",
      120,
      "Loc"
    );
    const result = contract.checkVarietyExistence(seedHash);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const nonExistHash = new Uint8Array(32).fill(12);
    const result2 = contract.checkVarietyExistence(nonExistHash);
    expect(result2.ok).toBe(true);
    expect(result2.value).toBe(false);
  });

  it("rejects variety registration with empty title", () => {
    contract.setAuthorityContract("ST2TEST");
    const seedHash = new Uint8Array(32).fill(13);
    const result = contract.registerVariety(
      seedHash,
      "",
      "Desc",
      "Origin",
      "vegetable",
      "tropical",
      300,
      [],
      "res",
      60,
      "Loc"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_TITLE);
  });

  it("rejects variety registration with max varieties exceeded", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.state.maxVarieties = 1;
    const seedHash1 = new Uint8Array(32).fill(14);
    contract.registerVariety(
      seedHash1,
      "Variety1",
      "Desc1",
      "Origin1",
      "fruit",
      "arid",
      400,
      ["trait1"],
      "res1",
      80,
      "Loc1"
    );
    const seedHash2 = new Uint8Array(32).fill(15);
    const result = contract.registerVariety(
      seedHash2,
      "Variety2",
      "Desc2",
      "Origin2",
      "herb",
      "temperate",
      200,
      ["trait2"],
      "res2",
      50,
      "Loc2"
    );
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_VARIETIES_EXCEEDED);
  });

  it("sets authority contract successfully", () => {
    const result = contract.setAuthorityContract("ST2TEST");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.authorityContract).toBe("ST2TEST");
  });

  it("rejects invalid authority contract", () => {
    const result = contract.setAuthorityContract("SP000000000000000000002Q6VF78");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });
});