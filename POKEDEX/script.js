const grid = document.getElementById('pokemon-grid');
const previewName = document.getElementById('preview-name');
const previewImg = document.getElementById('preview-img');
const previewLevel = document.getElementById('preview-level');
const previewStats = document.getElementById('preview-stats');
const searchInput = document.getElementById('search-input');
const partyList = document.getElementById('party-list');
const boxLabel = document.getElementById('box-label');

let currentBox = 1;
const POKEMON_PER_BOX = 30;

// Initialize
loadBoxPokemon(currentBox);
loadParty();

// Pagination
document.getElementById('next-box').onclick = () => changeBox(1);
document.getElementById('prev-box').onclick = () => changeBox(-1);

// Search
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    fetchAndPreview(searchInput.value.toLowerCase());
    searchInput.value = '';
  }
});

function changeBox(delta) {
  currentBox += delta;
  if (currentBox < 1) currentBox = 1;
  loadBoxPokemon(currentBox);
  boxLabel.textContent = `Box ${currentBox}`;
}

async function loadBoxPokemon(boxNum) {
  grid.innerHTML = '';
  const start = (boxNum - 1) * POKEMON_PER_BOX + 1;
  const end = start + POKEMON_PER_BOX - 1;

  for (let i = start; i <= end; i++) {
    const data = await fetchPokemon(i);
    createBoxSlot(data);
  }
}

async function loadParty() {
  const partyTeam = [6, 9, 130, 212, 303, 812]; // Example: Charizard, Blastoise, etc.
  for (let id of partyTeam) {
    const data = await fetchPokemon(id);
    const slot = document.createElement('div');
    slot.classList.add('party-slot');
    slot.innerHTML = `<img src="${data.sprites.front_default}" width="32" height="32"> ${capitalize(data.name)}<br><span>Lv. ${randomLevel()}</span>`;
    slot.addEventListener('click', () => showPreview(data));
    partyList.appendChild(slot);
  }
}

function createBoxSlot(pokemon) {
  const slot = document.createElement('div');
  slot.classList.add('poke-slot', `type-${pokemon.types[0].type.name}`);
  const img = document.createElement('img');
  img.src = pokemon.sprites.front_default;
  img.alt = pokemon.name;
  slot.appendChild(img);
  slot.addEventListener('click', () => showPreview(pokemon));
  grid.appendChild(slot);
}

async function fetchAndPreview(query) {
  try {
    const data = await fetchPokemon(query);
    showPreview(data);
  } catch {
    alert("Pokémon not found!");
  }
}

async function fetchPokemon(idOrName) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${idOrName}`);
  return await res.json();
}

async function showPreview(pokemon) {
  previewImg.src = pokemon.sprites.other['official-artwork'].front_default;
  previewName.textContent = capitalize(pokemon.name);
  previewLevel.textContent = `Lv. ${randomLevel()}`;

  // Cry
  const cry = document.getElementById('cry-audio');
  cry.src = pokemon.cries?.latest || pokemon.cries?.legacy || "";
  cry.play();

  // Type Badges
  const badgeContainer = document.getElementById('type-badges');
  badgeContainer.innerHTML = "";
  pokemon.types.forEach(t => {
    const badge = document.createElement('span');
    badge.className = `badge ${t.type.name}`;
    badge.innerText = capitalize(t.type.name);
    badgeContainer.appendChild(badge);
  });

  // Stats
  previewStats.innerHTML = pokemon.stats.map(stat =>
    `<div class="stat-line"><strong>${capitalize(stat.stat.name)}:</strong> ${stat.base_stat}</div>`
  ).join('');

  // Evolution Info
  const evoData = await getEvolutionInfo(pokemon.name);
  document.getElementById('evolution-info').innerHTML = evoData;
}


function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function randomLevel() {
  return Math.floor(Math.random() * 50) + 50;
}
async function getEvolutionInfo(name) {
  try {
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`);
    const speciesData = await speciesRes.json();
    const evoChainUrl = speciesData.evolution_chain.url;
    const evoRes = await fetch(evoChainUrl);
    const evoData = await evoRes.json();

    const evoNames = [];
    let evo = evoData.chain;

    do {
      evoNames.push(evo.species.name);
      evo = evo.evolves_to[0];
    } while (evo && evo.hasOwnProperty('evolves_to'));

    const currentIndex = evoNames.indexOf(name);
    const prev = evoNames[currentIndex - 1] || null;
    const next = evoNames[currentIndex + 1] || null;

    let html = "<h4>Evolution</h4><div>";
    if (prev) html += `⬅️ ${capitalize(prev)} `;
    html += `<strong>${capitalize(name)}</strong>`;
    if (next) html += ` ➡️ ${capitalize(next)}`;
    html += "</div>";

    return html;
  } catch (err) {
    return "<div><em>No evolution data</em></div>";
  }
}
document.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    const cols = 6; // because 6 columns in the box grid
    if (e.key === 'ArrowLeft' && selectedIndex > 0) selectedIndex--;
    if (e.key === 'ArrowRight' && selectedIndex < slots.length - 1) selectedIndex++;
    if (e.key === 'ArrowUp' && selectedIndex - cols >= 0) selectedIndex -= cols;
    if (e.key === 'ArrowDown' && selectedIndex + cols < slots.length) selectedIndex += cols;
    updateSelectedSlot();
    slots[selectedIndex].click();
  }
});
function updateSelectedSlot() {
  slots.forEach((slot, index) => {
    if (index === selectedIndex) {
      slot.classList.add('selected');
    } else {
      slot.classList.remove('selected');
    }
  });
}

function toggleStatsView() {
  if (!showingStats) {
    previewStats.style.display = 'block';
  } else {
    previewStats.style.display = 'none';
  }
  showingStats = !showingStats;
}

function toggleView() {
  viewingParty = !viewingParty;
  if (viewingParty) {
    grid.style.display = 'none';
    partyList.style.display = 'block';
  } else {
    grid.style.display = 'grid';
    partyList.style.display = 'block';
  }
}
document.getElementById('stats-btn').onclick = toggleStatsView;
document.getElementById('toggle-view-btn').onclick = toggleView;

