import { PrismaClient, MarketType, BetStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { calculateProfit, calculateRoi } from "../src/lib/calculations";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@marcador.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: "Admin" },
  });
  console.log(`Seeded admin user: ${adminEmail} / ${adminPassword}`);

  const countryNames = ["Brasil", "América do Sul"];
  const countries: Record<string, { id: string }> = {};
  for (const name of countryNames) {
    countries[name] = await prisma.country.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const leagueNames: [string, string][] = [
    ["Brasileirão Série A", "Brasil"],
    ["Copa do Brasil", "Brasil"],
    ["Libertadores", "América do Sul"],
  ];
  const leagues: Record<string, { id: string }> = {};
  for (const [name, countryName] of leagueNames) {
    leagues[name] = await prisma.league.upsert({
      where: { name },
      update: {},
      create: { name, countryId: countries[countryName].id },
    });
  }

  const teamNames = [
    "Flamengo",
    "Palmeiras",
    "São Paulo",
    "Corinthians",
    "Grêmio",
    "Cruzeiro",
    "Botafogo",
    "Atlético-MG",
  ];
  const teams: Record<string, { id: string }> = {};
  for (const name of teamNames) {
    teams[name] = await prisma.team.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Every club plays the national league + cup; only the two most recent Libertadores
  // regulars are linked there too — a team can belong to more than one league at once.
  for (const name of teamNames) {
    await prisma.team.update({
      where: { id: teams[name].id },
      data: { leagues: { connect: [{ id: leagues["Brasileirão Série A"].id }, { id: leagues["Copa do Brasil"].id }] } },
    });
  }
  for (const name of ["Flamengo", "Palmeiras"]) {
    await prisma.team.update({
      where: { id: teams[name].id },
      data: { leagues: { connect: [{ id: leagues["Libertadores"].id }] } },
    });
  }

  const bookmakerNames = ["Bet365", "Betano", "KTO"];
  const bookmakers: Record<string, { id: string }> = {};
  for (const name of bookmakerNames) {
    bookmakers[name] = await prisma.bookmaker.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const refereeNames = ["Márcio Nogueira", "Wagner Reis", "Otávio Lins", "Cauê Ferreira", "Renan Boaventura"];
  const referees: Record<string, { id: string }> = {};
  for (const name of refereeNames) {
    referees[name] = await prisma.referee.upsert({
      where: { name },
      update: {},
      create: { name, countryId: countries["Brasil"].id },
    });
  }

  const marketDefs: [string, MarketType][] = [
    ["Vencedor da partida", MarketType.TEAM],
    ["Artilheiro", MarketType.PLAYER],
    ["Total de faltas", MarketType.REFEREE],
    ["Over/Under total de gols", MarketType.GENERAL],
  ];
  const markets: Record<string, { id: string }> = {};
  for (const [name, type] of marketDefs) {
    markets[name] = await prisma.market.upsert({
      where: { name },
      update: {},
      create: { name, type },
    });
  }

  const playerDefs: [string, string][] = [
    ["Rafael Duarte", "Flamengo"],
    ["Bruno Aguiar", "Palmeiras"],
    ["Endrick Matos", "São Paulo"],
    ["Vitor Sampaio", "Corinthians"],
    ["Diego Prado", "Grêmio"],
  ];
  const players: Record<string, { id: string }> = {};
  for (const [name, teamName] of playerDefs) {
    const player = await prisma.player.upsert({
      where: { id: `seed-${name}` },
      update: {},
      create: {
        id: `seed-${name}`,
        name,
        currentTeamId: teams[teamName].id,
      },
    });
    players[name] = player;
  }

  // Sample bets across the last 8 months so the dashboard has real data to aggregate.
  type SeedBet = {
    marketName: string;
    leagueName: string;
    bookmakerName: string;
    home: string;
    away: string;
    targetTeam?: string;
    targetPlayer?: string;
    refereeName?: string;
    totalFouls?: number;
    odds: number;
    stake: number;
    eventDate: string;
    status: BetStatus;
  };

  const seedBets: SeedBet[] = [
    { marketName: "Vencedor da partida", leagueName: "Brasileirão Série A", bookmakerName: "Bet365", home: "Flamengo", away: "Cruzeiro", targetTeam: "Flamengo", odds: 1.85, stake: 200, eventDate: "2026-07-14", status: BetStatus.WON },
    { marketName: "Total de faltas", leagueName: "Brasileirão Série A", bookmakerName: "Betano", home: "Grêmio", away: "Botafogo", refereeName: "Márcio Nogueira", totalFouls: 27, odds: 2.1, stake: 150, eventDate: "2026-07-13", status: BetStatus.WON },
    { marketName: "Artilheiro", leagueName: "Copa do Brasil", bookmakerName: "KTO", home: "São Paulo", away: "Corinthians", targetPlayer: "Endrick Matos", odds: 3.4, stake: 100, eventDate: "2026-07-12", status: BetStatus.LOST },
    { marketName: "Over/Under total de gols", leagueName: "Brasileirão Série A", bookmakerName: "Bet365", home: "Atlético-MG", away: "Palmeiras", odds: 1.95, stake: 180, eventDate: "2026-07-12", status: BetStatus.PENDING },
    { marketName: "Vencedor da partida", leagueName: "Libertadores", bookmakerName: "Betano", home: "Palmeiras", away: "Flamengo", targetTeam: "Palmeiras", odds: 2.25, stake: 120, eventDate: "2026-07-10", status: BetStatus.VOID },
    { marketName: "Total de faltas", leagueName: "Brasileirão Série A", bookmakerName: "KTO", home: "Botafogo", away: "Cruzeiro", refereeName: "Wagner Reis", totalFouls: 22, odds: 1.72, stake: 220, eventDate: "2026-07-08", status: BetStatus.WON },
    { marketName: "Vencedor da partida", leagueName: "Brasileirão Série A", bookmakerName: "Bet365", home: "Cruzeiro", away: "São Paulo", targetTeam: "Cruzeiro", odds: 2.6, stake: 90, eventDate: "2026-07-05", status: BetStatus.LOST },
    { marketName: "Artilheiro", leagueName: "Brasileirão Série A", bookmakerName: "Betano", home: "Flamengo", away: "Botafogo", targetPlayer: "Rafael Duarte", odds: 2.8, stake: 130, eventDate: "2026-06-20", status: BetStatus.WON },
    { marketName: "Artilheiro", leagueName: "Brasileirão Série A", bookmakerName: "KTO", home: "Palmeiras", away: "Grêmio", targetPlayer: "Bruno Aguiar", odds: 3.1, stake: 100, eventDate: "2026-06-14", status: BetStatus.WON },
    { marketName: "Vencedor da partida", leagueName: "Brasileirão Série A", bookmakerName: "Bet365", home: "Grêmio", away: "Cruzeiro", targetTeam: "Cruzeiro", odds: 2.0, stake: 100, eventDate: "2026-05-22", status: BetStatus.LOST },
    { marketName: "Artilheiro", leagueName: "Copa do Brasil", bookmakerName: "Betano", home: "Corinthians", away: "São Paulo", targetPlayer: "Diego Prado", odds: 3.6, stake: 100, eventDate: "2026-05-10", status: BetStatus.LOST },
    { marketName: "Vencedor da partida", leagueName: "Brasileirão Série A", bookmakerName: "KTO", home: "São Paulo", away: "Botafogo", targetTeam: "São Paulo", odds: 1.9, stake: 150, eventDate: "2026-04-18", status: BetStatus.WON },
    { marketName: "Total de faltas", leagueName: "Brasileirão Série A", bookmakerName: "Bet365", home: "Atlético-MG", away: "Flamengo", refereeName: "Otávio Lins", totalFouls: 31, odds: 2.3, stake: 80, eventDate: "2026-03-30", status: BetStatus.WON },
    { marketName: "Vencedor da partida", leagueName: "Brasileirão Série A", bookmakerName: "Betano", home: "Botafogo", away: "Palmeiras", targetTeam: "Botafogo", odds: 2.4, stake: 100, eventDate: "2026-02-15", status: BetStatus.LOST },
    { marketName: "Artilheiro", leagueName: "Brasileirão Série A", bookmakerName: "KTO", home: "Cruzeiro", away: "Grêmio", targetPlayer: "Vitor Sampaio", odds: 2.9, stake: 100, eventDate: "2026-01-12", status: BetStatus.WON },
    { marketName: "Vencedor da partida", leagueName: "Brasileirão Série A", bookmakerName: "Bet365", home: "Flamengo", away: "São Paulo", targetTeam: "São Paulo", odds: 2.7, stake: 100, eventDate: "2025-12-08", status: BetStatus.LOST },
  ];

  for (const [index, b] of seedBets.entries()) {
    const seedBetId = `seed-bet-${index}`;
    let refereedMatchId: string | undefined;
    if (b.refereeName && b.totalFouls !== undefined) {
      const match = await prisma.refereedMatch.upsert({
        where: {
          uniqueMatch: {
            refereeId: referees[b.refereeName].id,
            homeTeamId: teams[b.home].id,
            awayTeamId: teams[b.away].id,
            eventDate: new Date(b.eventDate),
            totalFouls: b.totalFouls,
          },
        },
        update: {},
        create: {
          refereeId: referees[b.refereeName].id,
          leagueId: leagues[b.leagueName].id,
          homeTeamId: teams[b.home].id,
          awayTeamId: teams[b.away].id,
          eventDate: new Date(b.eventDate),
          totalFouls: b.totalFouls,
        },
      });
      refereedMatchId = match.id;
    }

    const profit = calculateProfit(b.status, b.odds, b.stake);
    const roi = calculateRoi(profit, b.stake);

    await prisma.bet.upsert({
      where: { id: seedBetId },
      update: {},
      create: {
        id: seedBetId,
        userId: user.id,
        marketId: markets[b.marketName].id,
        leagueId: leagues[b.leagueName].id,
        bookmakerId: bookmakers[b.bookmakerName].id,
        homeTeamId: teams[b.home].id,
        awayTeamId: teams[b.away].id,
        targetTeamId: b.targetTeam ? teams[b.targetTeam].id : null,
        targetPlayerId: b.targetPlayer ? players[b.targetPlayer].id : null,
        refereedMatchId: refereedMatchId ?? null,
        odds: b.odds,
        stake: b.stake,
        eventDate: new Date(b.eventDate),
        status: b.status,
        profit: profit ?? undefined,
        roi: roi ?? undefined,
      },
    });
  }

  console.log(`Seeded ${seedBets.length} sample bets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
