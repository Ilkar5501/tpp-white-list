let cardData = [];
let lastCard = null;

const FILTER_DATA = [
  {
    label: "Type",
    attr: "type",
    options: () => new Set(cardData.flatMap((card) => card.type)),
  },
  { label: "Attribute", attr: "attribute" },
  { label: "Category", attr: "category" },
  { label: "Level", attr: "number_value", numeric: true },
  { label: (filters) => filters.type.replace("Card", "Type"), attr: "race" },
  { label: "Archetype", attr: "archetype" },
  { label: "Ability", attr: "abilities" },
];

async function loadCardData(urlParams) {
  try {
    const response = await fetch("card_data.json");
    cardData = await response.json();
    displayCards(cardData);
    preloadFilters(urlParams);
  } catch (error) {
    console.error("Error loading card data:", error);
  }
}

function preloadFilters(urlParams) {
  if (urlParams.has("name")) {
    document.getElementById("nameSearch").value = urlParams.get("name");
  }
  if (urlParams.has("effect")) {
    document.getElementById("effectSearch").value = urlParams.get("effect");
  }
  FILTER_DATA.forEach(({ attr }) => {
    if (urlParams.has(attr)) {
      filterNode(attr).value = urlParams.get(attr);
    }
  });
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

  FILTER_DATA.forEach(({ label, attr, ...other }) => {
    populateFilterDropdown(
      label instanceof Function ? label(filters) : label,
      other.options ? other.options() : availableOptions(attr),
      filterNode(attr),
      !!other.numeric
    );
  });
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
    FILTER_DATA.forEach(
      ({ attr }) => (attrsMatch &&= checkAttr(attr, card, attrs))
    );
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
  const filters = {
    name: normalizeSearchTerm(document.getElementById("nameSearch").value),
    effect: document.getElementById("effectSearch").value.toLowerCase(),
  };

  FILTER_DATA.forEach(({ attr }) => (filters[attr] = filterValue(attr)));
  return filters;
}

function filterCards() {
  const filters = fetchFilters();
  var filteredObject = Object.keys(filters).reduce((obj, key) => {
    if (filters[key] != "" && filters[key] != "-") obj[key] = filters[key];
    return obj;
  }, {});

  const current = new URL(window.location.href);
  current.search = new URLSearchParams(filteredObject).toString();
  window.history.pushState("", "", current);
  displayCards(filteredCards(fetchFilters()));
}

function setValue(id, value, show) {
  const node = document.getElementById(id);
  node.innerText = value;
  node.parentElement.style.display =
    (show === undefined || show) && value ? "block" : "none";
}

function showCardInfo(card, imgSrc) {
  const img = document.getElementById("infoImage");
  img.src = imgSrc;
  img.title = card.name;
  img.alt = `Yu-Gi-Oh Card named ${card.name}. See below for details.`;

  setValue("infoName", card.name);
  setValue("infoType", card.type);
  setValue("infoAttribute", card.attribute);
  setValue(
    "infoAtkDef",
    `${card.atk || "0"} / ${card.def || "0"}`,
    !!card.atk || !!card.def
  );
  setValue("infoLevel", card.level);
  setValue("infoLinkValue", card.linkval);
  setValue("infoRace", card.race);
  setValue("infoDesc", card.desc);

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

loadCardData(new URLSearchParams(window.location.search));
