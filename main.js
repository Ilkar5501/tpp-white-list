import { h, render, Component, Fragment, createRef } from "preact";
import htm from "htm";

// Initialize htm with Preact
const html = htm.bind(h);

const FILTER_DATA_MAP = {
  type: {
    label: "Type",
    options: (cards) => new Set(cards.flatMap((card) => card.type)),
  },
  attribute: { label: "Attribute" },
  category: { label: "Category" },
  number_value: { label: "Level", numeric: true },
  race: { label: (filters) => filters.type.replace("Card", "Type") },
  archetype: { label: "Archetype" },
  abilities: { label: "Ability" },
};

async function loadCardData(urlParams) {
  try {
    const response = await fetch("card_data.json");
    const cards = await response.json();
    render(
      html`<${ThePlunderPiratesSite} urlParams=${urlParams} cards=${cards} />`,
      document.body
    );
  } catch (error) {
    console.error("Error loading card data:", error);
  }
}

function normalizeSearchTerm(term) {
  return term.replace(/[?/'!,:&."]/g, "_").toLowerCase();
}

function checkAttr(attr, card, attrs) {
  if (card[attr] instanceof Array) {
    return attrs[attr] != "-" ? card[attr].includes(attrs[attr]) : true;
  } else {
    return attrs[attr] != "-" ? attrs[attr] == card[attr] : true;
  }
}

loadCardData(new URLSearchParams(window.location.search));

function SearchBar({ name, value, onInput }) {
  return html`<input
    type="text"
    value=${value}
    onInput="${onInput}"
    class="searchBar"
    placeholder="Search by ${name}..."
  />`;
}

function FilterSelect({ value, onChange, title, options, disabled }) {
  return html`<select
    value=${value}
    class="filter"
    onChange=${onChange}
    disabled=${disabled}
  >
    <option value="-">- ${title} -</option>
    ${options.map((option) => html`<option value=${option}>${option}</option>`)}
  </select>`;
}

function showVal(label, value, show) {
  if ((show === undefined || show) && value) {
    return html`<p><strong>${label}: </strong><span>${value}</span></p>`;
  }
}

function CardInfo({ card, onClose }) {
  return html`<${Fragment}>
    <button class="close-btn" onclick=${onClose}>X</button>
    <${CardImg} card=${card} />
    <h2 id="infoName">${card.name}</h2>
    ${showVal("Card Type", card.full_type)}
    ${showVal("Attribute", card.attribute)}
    ${showVal(
      "ATK / DEF",
      `${card.atk || "0"} / ${card.def || "0"}`,
      !!card.atk || !!card.def
    )}
    ${showVal("Level", card.level)} ${showVal("Link Value", card.linkval)}
    ${showVal(
      card.type == "Monster Card" ? "Monster Type" : "Sub-Type",
      card.race
    )}
    ${showVal("Effect", card.desc)}
    <div class="bottomPadding"></div>
  </${Fragment}>`;
}

function CardImg({ card, imgRef, isSmall, onClick, highlight }) {
  const formattedName = card.name
    .replace(/[?/'!,:&."]/g, "_")
    .replace(/\s+/g, " ");
  return html`<img
    key=${card.name}
    ref=${imgRef}
    class="card ${highlight ? "current" : ""}"
    src="card_images/${isSmall ? "small/" : ""}${formattedName}.jpg"
    title=${card.name}
    alt=${card.name}
    onClick=${onClick}
  />`;
}

class ThePlunderPiratesSite extends Component {
  currentCard = createRef();

  constructor(props) {
    super(props);
    this.state = {
      name: "",
      effect: "",

      type: "-",
      attribute: "-",
      archetype: "-",
      number_value: "-",

      race: "-",
      category: "-",
      abilities: "-",

      current_card: null,
      zoom_in: false,
    };
    props.urlParams.forEach((v, k) => {
      if (k === "current_card") {
        props.cards.forEach((card) => {
          if (card.name == v) {
            this.state.current_card = card;
            setTimeout(() => this.focusCard(), 50);
          }
        });
      } else {
        this.state[k] = v;
      }
    });
  }

  filteredCards(attrs) {
    return this.props.cards.filter((card) => {
      const normalizedCardName = normalizeSearchTerm(card.name);
      const nameMatch = attrs.name
        .split("*")
        .every((term) => normalizedCardName.includes(term.trim()));
      const effectMatch = attrs.effect
        .split("*")
        .every((term) => card.desc.toLowerCase().includes(term.trim()));

      let attrsMatch = true;
      Object.keys(FILTER_DATA_MAP).forEach(
        (attr) => (attrsMatch &&= checkAttr(attr, card, attrs))
      );
      return nameMatch && effectMatch && attrsMatch;
    });
  }

  updateValue = (key, extraOnChange) => (e) => {
    const v = e.currentTarget.value;
    this.setState({ [key]: v });
    if (extraOnChange) {
      extraOnChange(v);
    }
  };

  availableOptions(category) {
    let currentFilters = structuredClone(this.state);
    currentFilters[category] = "-";
    let cards = this.filteredCards(currentFilters);
    return new Set(cards.flatMap((card) => card[category]));
  }

  fieldFilter(type, extraOnChange) {
    let { label, numeric, ...other } = FILTER_DATA_MAP[type];
    label = label instanceof Function ? label(this.state) : label;
    const options = other.options
      ? other.options(this.props.cards)
      : this.availableOptions(type);
    let typesList = [...options].filter((type) => !!type);
    if (numeric) {
      typesList.sort((a, b) => a - b);
    } else {
      typesList.sort();
    }

    if (this.state[type] != "-" && !typesList.includes(this.state[type])) {
      this.setState({ [type]: "-" });
    }

    return html`<${FilterSelect}
      value=${typesList.includes(this.state[type]) ? this.state[type] : "-"}
      disabled=${typesList.length == 0}
      title="${label}"
      options=${typesList}
      onChange=${this.updateValue(type, extraOnChange)}
    />`;
  }

  componentWillUpdate(_nextProps, nextState) {
    var filteredObject = Object.keys(nextState).reduce((obj, key) => {
      if (
        nextState[key] &&
        nextState[key] instanceof String &&
        nextState[key] != "" &&
        nextState[key] != "-"
      )
        obj[key] = nextState[key];
      return obj;
    }, {});
    if (nextState.current_card) {
      filteredObject.current_card = nextState.current_card.name;
    }
    const current = new URL(window.location.href);
    current.search = new URLSearchParams(filteredObject).toString();
    window.history.replaceState("", "", current);
  }

  focusCard() {
    if (this.currentCard.current) {
      this.currentCard.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  render() {
    return html`<${Fragment}>
    <div class="headerBar">
        <img id="bannerImage" src="Banner.png" />
        <h1>The Plunder Pirates</h1>
    </div>
    <div
      id="mainContent"
      style=${this.state.current_card ? "margin-right: calc(25% + 30px)" : ""}
    >
      <div id="searchContainer">
        <${SearchBar} name="name" value=${
      this.state.name
    } onInput="${this.updateValue("name")}" />
        <${SearchBar} name="effect" value=${
      this.state.effect
    } onInput="${this.updateValue("effect")}" />
      </div>
      <div id="filterContainer">
        ${this.fieldFilter("type", (v) => {
          if (v == "-") {
            this.setState({
              race: "-",
              category: "-",
              abilities: "-",
            });
          }
        })}
        ${this.fieldFilter("attribute")} ${this.fieldFilter("archetype")}
        ${this.fieldFilter("number_value")}
      </div>
      ${
        this.state.type != "-"
          ? html` <div id="moreFilters">
              ${this.fieldFilter("race")} ${this.fieldFilter("category")}
              ${this.fieldFilter("abilities")}
            </div>`
          : null
      }
      <div id="cardContainer">
        ${this.filteredCards(this.state).map((card) => {
          const focusCard = () => {
            this.setState({
              current_card: card,
            });
            for (let i = 10; i <= 300; i += 10) {
              setTimeout(() => this.focusCard(), i);
            }
          };
          const isCurrent =
            this.state.current_card &&
            this.state.current_card.name == card.name;
          return html`<${CardImg}
            imgRef=${isCurrent ? this.currentCard : null}
            highlight=${isCurrent}
            card=${card}
            onClick=${focusCard}
            isSmall=${true}
          />`;
        })}
      </div>
      <div
        id="cardinfo"
        style=${this.state.current_card ? "transform: translateX(0)" : ""}
      >
        ${
          this.state.current_card
            ? html`<${CardInfo}
                card=${this.state.current_card}
                onClose=${() => this.setState({ current_card: null })}
              />`
            : null
        }
      </div>
      <div class="bottomPadding"></div>
    </div>
    </${Fragment}>`;
  }
}
