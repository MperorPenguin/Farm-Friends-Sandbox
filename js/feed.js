/* js/feed.js
   Feed the Animals — self-contained module
   - Uses existing ANIMALS data (expects .id, .name, .image, .diet)
   - Uses your existing button styles by applying .btn, .btn-hero, .btn-lg to main controls
   - Mobile-first layout; ARIA-friendly; no global CSS assumptions
*/

(function () {
  // ---- Food image registry (display name -> image path in /assets/food) ----
  const FOOD_IMAGES = {
    "Grass":       "assets/food/grass.png",
    "Hay":         "assets/food/hay.png",
    "Silage":      "assets/food/silage.png",
    "Grains":      "assets/food/grains.png",
    "Seeds":       "assets/food/seeds.png",
    "Worms":       "assets/food/worms.png",
    "Pellets":     "assets/food/pellets.png",
    "Corn":        "assets/food/corn.png",
    "Vegetables":  "assets/food/vegetables.png"
  };

  // ---- Small helpers (no framework assumptions) ----
  const rand = (n) => Math.floor(Math.random() * n);
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  function parseDiet(dietStr) {
    if (!dietStr) return [];
    return dietStr
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1));
  }

  function allKnownFoods() {
    const set = new Set();
    (window.ANIMALS || []).forEach(a => parseDiet(a.diet).forEach(f => set.add(f)));
    return Array.from(set);
  }

  function foodImgSrc(foodName) {
    return FOOD_IMAGES[foodName] || FOOD_IMAGES["Grass"];
  }

  // ---- Game controller ----
  const FeedGame = (() => {
    let lastAnimalId = null;
    let score = 0;
    let round = 0;

    function pickAnimal() {
      const list = window.ANIMALS || [];
      if (!list.length) return null;
      // avoid immediate repeat
      let choice = list[0];
      for (let i = 0; i < 6; i++) {
        const c = list[rand(list.length)];
        if (c.id !== lastAnimalId) { choice = c; break; }
      }
      lastAnimalId = choice.id;
      return choice;
    }

    function buildOptions(correctFoods, allFoods) {
      const correct = correctFoods[rand(correctFoods.length)];
      const pool = allFoods.filter(f => !correctFoods.includes(f));
      shuffle(pool);
      const distractors = pool.slice(0, 3);
      return { correct, options: shuffle([correct, ...distractors]) };
    }

    function updateStats(root) {
      root.querySelector("#feed-round").textContent = `Round: ${round}`;
      root.querySelector("#feed-score").textContent = `Score: ${score}`;
    }

    function speak(root, msg) {
      root.querySelector("#feed-result").textContent = msg || "";
    }

    function startRound(root) {
      round++;
      updateStats(root);

      const animal = pickAnimal();
      if (!animal) { speak(root, "No animals found."); return; }

      // Show animal
      const img = root.querySelector("#feed-animal-img");
      img.src = animal.image;
      img.alt = animal.name;

      root.querySelector("#feed-animal-name").textContent = animal.name;

      // Options
      const correctFoods = parseDiet(animal.diet);
      const foods = allKnownFoods();
      const { correct, options } = buildOptions(correctFoods, foods);

      const optsWrap = root.querySelector(".feed-options");
      optsWrap.innerHTML = "";
      options.forEach(food => {
        const btn = document.createElement("button");
        btn.className = "feed-card";              // local style only
        btn.setAttribute("type", "button");
        btn.setAttribute("role", "listitem");
        btn.innerHTML = `
          <img src="${foodImgSrc(food)}" alt="${food}">
          <span class="feed-food-label">${food}</span>
        `;
        btn.addEventListener("click", () => {
          if (food === correct) {
            score++;
            speak(root, `Correct! ${animal.name} eats ${correct}.`);
          } else {
            speak(root, `Oops! ${animal.name} prefers ${correct}.`);
          }
          updateStats(root);
          optsWrap.querySelectorAll("button").forEach(b => b.disabled = true);
          root.querySelector("#feed-next").disabled = false;
        });
        optsWrap.appendChild(btn);
      });

      root.querySelector("#feed-next").disabled = true;
      speak(root, "");
    }

    function render(mountEl) {
      mountEl.innerHTML = `
        <div class="feed-wrap" role="region" aria-label="Feed the Animals Game">
          <div class="feed-header">
            <h2 class="feed-title">Feed the Animals</h2>
            <div class="feed-stats" role="status" aria-live="polite">
              <span id="feed-round">Round: 0</span>
              <span id="feed-score">Score: 0</span>
            </div>
          </div>

          <div class="feed-stage">
            <div class="feed-animal card">
              <img id="feed-animal-img" alt="">
              <h3 id="feed-animal-name" class="feed-animal-name"></h3>
              <p class="feed-prompt">What does this animal eat?</p>
            </div>

            <div class="feed-options" role="list" aria-label="Food options"></div>
          </div>

          <div class="feed-controls">
            <button id="feed-next" class="btn btn-hero btn-lg" type="button" disabled>
              <span class="btn-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" focusable="false" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>
              </span>
              <span class="btn-label">Next</span>
            </button>

            <button id="feed-reset" class="btn btn-lg" type="button">
              <span class="btn-label">Reset</span>
            </button>
          </div>

          <div id="feed-result" class="feed-result" role="status" aria-live="polite"></div>
        </div>
      `;

      // Hook controls
      const nextBtn = mountEl.querySelector("#feed-next");
      const resetBtn = mountEl.querySelector("#feed-reset");

      nextBtn.addEventListener("click", () => startRound(mountEl));
      resetBtn.addEventListener("click", () => {
        // reset without touching any global UI
        lastAnimalId = null;
        round = 0;
        score = 0;
        updateStats(mountEl);
        startRound(mountEl);
        speak(mountEl, "Game reset. Let's play again!");
      });

      // first round
      startRound(mountEl);
    }

    return { render };
  })();

  // Public mount that your router can call
  window.mountFeedGame = function mountFeedGame(targetSelector) {
    const el = document.querySelector(targetSelector || "#view-feed");
    if (!el) return console.warn("Feed mount target not found:", targetSelector);
    FeedGame.render(el);
  };
})();
