let cardData = [];

async function loadCardData() {
  try {
    const response = await fetch("card_data.json");
    cardData = await response.json();
    displayCards(cardData);
  } catch (error) {
    console.error("Error loading card data:", error);
  }
}

function normalizeSearchTerm(term) {
  return term.replace(/[?/'!,:&."]/g, "_").toLowerCase();
}

function displayCards(cards) {
  updateFilterOptions(cards);
  const container = document.getElementById("cardContainer");
  container.innerHTML = "";

  cards.forEach((card, ix) => {
    const formattedName = card.name
      .replace(/[?/'!,:&."]/g, "_")
      .replace(/\s+/g, " ");
    const img = document.createElement("img");
    img.src = `card_images/small/${formattedName}.jpg`;
    img.classList.add("card");
    img.onclick = () => showCardInfo(card, `card_images/${formattedName}.jpg`);
    if (ix > 50) {
      img.loading = "lazy";
    }
    container.appendChild(img);
  });
}

function updateFilterOptions() {
  populateFilterDropdown(
    "Type",
    availableOptions("type"),
    document.querySelector(".filter[name=type]")
  );
  populateFilterDropdown(
    "Attribute",
    availableOptions("attribute"),
    document.querySelector(".filter[name=attribute]")
  );
  populateFilterDropdown(
    "Level",
    availableOptions("level"),
    document.querySelector(".filter[name=level]"),
    true
  );
  populateFilterDropdown(
    "Monster Type",
    availableOptions("race"),
    document.querySelector(".filter[name=monsterType]")
  );
}

function availableOptions(category) {
  let currentFilters = fetchFilters();
  currentFilters[category] = "-";
  let cards = filteredCards(currentFilters);
  let result = new Set();
  return new Set(cards.map((card) => card[category]));
}

function populateFilterDropdown(category, types, node, numeric) {
  const value = node.value;
  while (node.options.length > 0) {
    node.remove(0);
  }
  const option = document.createElement("option");
  option.value = "-";
  option.innerText = `- ${category} -`;
  node.appendChild(option);
  let typesList = [...types].filter((type) => !!type);
  node.disabled = typesList.length == 0;
  if (numeric) {
    typesList.sort((a, b) => a - b);
  } else {
    typesList.sort();
  }
  typesList.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.innerText = type;
    node.appendChild(option);
  });
  if (value) {
    node.value = value;
  } else {
    node.value = "-";
  }
}

function sortCards() {
  filterCards(); // Calls filterCards() so sorting applies dynamically
}

function checkAttr(attr, card, attrs) {
  return attrs[attr] != "-" ? attrs[attr] == card[attr] : true;
}

function filteredCards(attrs) {
  return cardData.filter((card) => {
    const normalizedCardName = normalizeSearchTerm(card.name);
    const nameMatch = attrs.name
      .split("*")
      .every((term) => normalizedCardName.includes(term.trim()));
    const effectMatch = attrs.effect
      .split("*")
      .every((term) => card.desc.toLowerCase().includes(term.trim()));
    let check = (attr) => checkAttr(attr, card, attrs);
    const typeMatch = check("type");
    const attributeMatch = check("attribute");
    const levelMatch = check("level");
    const monsterTypeMatch = check("race");
    return (
      nameMatch &&
      effectMatch &&
      typeMatch &&
      attributeMatch &&
      levelMatch &&
      monsterTypeMatch
    );
  });
}

function fetchFilters() {
  return {
    name: normalizeSearchTerm(document.getElementById("nameSearch").value),
    effect: document.getElementById("effectSearch").value.toLowerCase(),

    type: document.querySelector(".filter[name=type]").value || "-",
    attribute: document.querySelector(".filter[name=attribute]").value || "-",
    level: document.querySelector(".filter[name=level]").value || "-",
    race: document.querySelector(".filter[name=monsterType]").value || "-",
  };
}

function filterCards() {
  displayCards(filteredCards(fetchFilters()));
}

function showCardInfo(card, imgSrc) {
  document.getElementById("infoImage").src = imgSrc;
  document.getElementById("infoName").innerText = card.name;
  document.getElementById("infoType").innerText = card.type;
  document.getElementById("infoAttribute").innerText = card.attribute;
  document.getElementById("infoLevel").innerText = card.level;
  document.getElementById("infoRace").innerText = card.race;
  document.getElementById("infoDesc").innerText = card.desc;

  document.getElementById("infoAttributeWrapper").style.display = card.attribute
    ? "block"
    : "none";
  document.getElementById("infoLevelWrapper").style.display = card.level
    ? "block"
    : "none";

  document.getElementById("cardinfo").style.transform = "translateX(0)";
  document.getElementById("mainContent").style.marginRight = "calc(25% + 30px)";
}

function closeCardInfo() {
  document.getElementById("cardinfo").style.transform = null;
  document.getElementById("mainContent").style.marginRight = "0";
}

loadCardData();
