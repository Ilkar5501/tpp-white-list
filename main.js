let cardData = [];
let lastCard = null;

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
    img.title = card.name;
    img.alt = `Yu-Gi-Oh Card named ${card.name}. Click for details.`;

    img.classList.add("card");
    img.onclick = (event) => {
      if (lastCard) {
        lastCard.classList.remove("current");
      }
      lastCard = event.target;
      lastCard.classList.add("current");
      focusCard();
      // Do it again after the animation
      setTimeout(focusCard, 300);
      showCardInfo(card, `card_images/${formattedName}.jpg`);
    };
    if (ix > 50) {
      img.loading = "lazy";
    }
    container.appendChild(img);
  });
}

function focusCard(behavior) {
  lastCard.scrollIntoView({ behavior: behavior || "smooth", block: "center" });
}

function updateFilterOptions() {
  const filters = fetchFilters();

  populateFilterDropdown(
    "Type",
    new Set(cardData.flatMap((card) => card.type)),
    filterNode("type")
  );
  populateFilterDropdown(
    "Attribute",
    availableOptions("attribute"),
    filterNode("attribute")
  );
  populateFilterDropdown(
    "Category",
    availableOptions("category"),
    filterNode("category")
  );
  populateFilterDropdown(
    "Level",
    availableOptions("number_value"),
    filterNode("level"),
    true
  );
  populateFilterDropdown(
    filters.type === "Monster Card"
      ? "Monster Type"
      : filters.type == "Spell Card"
      ? "Spell Type"
      : "Trap Type",
    availableOptions("race"),
    filterNode("subType")
  );
  populateFilterDropdown(
    "Archetype",
    availableOptions("archetype"),
    filterNode("archetype")
  );
  populateFilterDropdown(
    "Ability",
    availableOptions("abilities"),
    filterNode("abilities")
  );
}

function availableOptions(category) {
  let currentFilters = fetchFilters();
  currentFilters[category] = "-";
  let cards = filteredCards(currentFilters);
  return new Set(cards.flatMap((card) => card[category]));
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
  let validOption = false;
  typesList.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.innerText = type;
    node.appendChild(option);
    if (value == type) {
      validOption = true;
    }
  });
  if (value && validOption) {
    node.value = value;
  } else {
    if (value != "-") {
      node.value = "-";
      setTimeout(filterCards, 1);
    }
  }

  if (node.dataset.requires) {
    const currentFilters = fetchFilters();
    if (
      currentFilters[node.dataset.requires] &&
      currentFilters[node.dataset.requires] != "-"
    ) {
      node.style.display = "block";
    } else {
      node.style.display = "none";
      if (node.value != "-") {
        node.value = "-";
        setTimeout(filterCards, 1);
      }
    }
  }
}

function sortCards() {
  filterCards(); // Calls filterCards() so sorting applies dynamically
}

function checkAttr(attr, card, attrs) {
  if (card[attr] instanceof Array) {
    return attrs[attr] != "-" ? card[attr].includes(attrs[attr]) : true;
  } else {
    return attrs[attr] != "-" ? attrs[attr] == card[attr] : true;
  }
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

    let attrsMatch = true;
    [
      "type",
      "attribute",
      "number_value",
      "race",
      "archetype",
      "category",
      "abilities",
    ].forEach((attr) => (attrsMatch &&= checkAttr(attr, card, attrs)));
    return nameMatch && effectMatch && attrsMatch;
  });
}

function filterNode(name) {
  return document.querySelector(`.filter[name=${name}]`);
}

function filterValue(name) {
  return filterNode(name).value || "-";
}

function fetchFilters() {
  return {
    name: normalizeSearchTerm(document.getElementById("nameSearch").value),
    effect: document.getElementById("effectSearch").value.toLowerCase(),

    type: filterValue("type"),
    attribute: filterValue("attribute"),
    number_value: filterValue("level"),
    race: filterValue("subType"),
    archetype: filterValue("archetype"),
    category: filterValue("category"),
    abilities: filterValue("abilities"),
  };
}

function filterCards() {
  displayCards(filteredCards(fetchFilters()));
}

function showCardInfo(card, imgSrc) {
  const img = document.getElementById("infoImage");
  img.src = imgSrc;
  img.title = card.name;
  img.alt = `Yu-Gi-Oh Card named ${card.name}. See below for details.`;

  document.getElementById("infoName").innerText = card.name;
  document.getElementById("infoType").innerText = card.type;
  document.getElementById("infoAttribute").innerText = card.attribute;
  document.getElementById("infoLevel").innerText = card.level;
  document.getElementById("infoLinkValue").innerText = card.linkval;
  document.getElementById("infoRace").innerText = card.race;
  document.getElementById("infoDesc").innerText = card.desc;

  document.getElementById("infoAttributeWrapper").style.display = card.attribute
    ? "block"
    : "none";
  document.getElementById("infoLevelWrapper").style.display = card.level
    ? "block"
    : "none";
  document.getElementById("infoLinkValueWrapper").style.display = card.linkval
    ? "block"
    : "none";

  document.getElementById("cardinfo").style.transform = "translateX(0)";
  document.getElementById("mainContent").style.marginRight = "calc(25% + 30px)";
}

function closeCardInfo() {
  document.getElementById("cardinfo").style.transform = null;
  document.getElementById("mainContent").style.marginRight = "0";
  setTimeout(() => {
    focusCard("instant");
    if (lastCard) {
      lastCard.classList.remove("current");
    }
    lastCard = null;
  }, 300);
}

loadCardData();
