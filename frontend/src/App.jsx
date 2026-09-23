import { useEffect, useState } from "react";
import "./App.css";


function App() {

  // ------------------------------------------------
  // STATE
  // ------------------------------------------------

  // Stores FPL players
  const [fplPlayers, setFplPlayers] = useState([]);

  // Stores F1 drivers
  const [f1Players, setF1Players] = useState([]);

  // Stores NFL players
  const [nflPlayers, setNflPlayers] = useState([]);

  // Controls which tab is visible
  const [activeTab, setActiveTab] = useState("overall");

  // Search box text
  const [searchTerm, setSearchTerm] = useState("");

  // Position filter
  const [positionFilter, setPositionFilter] = useState("ALL");
  
  //Sort players by price/points
  const [sortBy, setSortBy] = useState("points");


  // ------------------------------------------------
  // LOAD DATA FROM FASTAPI
  // ------------------------------------------------

  useEffect(() => {

    // FPL
    fetch("http://127.0.0.1:8000/players")
      .then((response) => response.json())
      .then((data) => {
        setFplPlayers(data);
      });


    // F1
    fetch("http://127.0.0.1:8000/f1/players")
      .then((response) => response.json())
      .then((data) => {
        setF1Players(data);
      });


    // NFL
    fetch("http://127.0.0.1:8000/nfl/players")
      .then((response) => response.json())
      .then((data) => {
        setNflPlayers(data);
      });

  }, []);


  // ------------------------------------------------
  // FPL FILTER
  // ------------------------------------------------

  const filteredFplPlayers = fplPlayers
  .filter((player) => {
    const matchesSearch = (player.player_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesPosition =
      positionFilter === "ALL" ||
      player.position === positionFilter;

    return matchesSearch && matchesPosition;
  })
  .sort((a, b) => {

    if (sortBy === "points") {
      return b.total_points - a.total_points;
    }

    if (sortBy === "price") {
      return b.price - a.price;
    }

    if (sortBy === "name") {
      return a.player_name.localeCompare(
        b.player_name
      );
    }

    return 0;
  });

 
  // ------------------------------------------------
  // F1 FILTER
  // ------------------------------------------------

  const filteredF1Players = f1Players.filter((driver) => {

    return (driver.driver_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });


  // ------------------------------------------------
  // NFL FILTER
  // ------------------------------------------------

  const filteredNflPlayers = nflPlayers.filter((player) => {

    const matchesSearch = (player.player_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesPosition =
      positionFilter === "ALL" ||
      player.position === positionFilter;

    return matchesSearch && matchesPosition;
  });


  // ------------------------------------------------
  // TAB SWITCH
  // ------------------------------------------------

  function switchTab(tab) {

    setActiveTab(tab);

    // Reset search/filter when switching sports
    setSearchTerm("");
    setPositionFilter("ALL");
  }


  return (

    <div className="app">


      {/* ============================================= */}
      {/* HEADER */}
      {/* ============================================= */}

      <header className="main-header">

        <h1>
          Multi-Sport Fantasy
        </h1>

        <p>
          Draft athletes across multiple sports.
        </p>

      </header>


      {/* ============================================= */}
      {/* TABS */}
      {/* ============================================= */}

      <nav className="tabs">

        <button
          className={
            activeTab === "overall"
              ? "active-tab"
              : ""
          }
          onClick={() =>
            switchTab("overall")
          }
        >
          Overall
        </button>


        <button
          className={
            activeTab === "fpl"
              ? "active-tab"
              : ""
          }
          onClick={() =>
            switchTab("fpl")
          }
        >
          ⚽ FPL
        </button>


        <button
          className={
            activeTab === "f1"
              ? "active-tab"
              : ""
          }
          onClick={() =>
            switchTab("f1")
          }
        >
          🏎️ F1
        </button>


        <button
          className={
            activeTab === "nfl"
              ? "active-tab"
              : ""
          }
          onClick={() =>
            switchTab("nfl")
          }
        >
          🏈 NFL
        </button>

      </nav>


      {/* ============================================= */}
      {/* OVERALL */}
      {/* ============================================= */}

      {activeTab === "overall" && (

        <main className="overall-page">

          <h2>
            League Overview
          </h2>


          <div className="sport-summary-grid">


            <div className="sport-summary-card">

              <div className="sport-icon">
                ⚽
              </div>

              <h3>
                FPL
              </h3>

              <p>
                {fplPlayers.length} players
              </p>

              <button
                onClick={() =>
                  switchTab("fpl")
                }
              >
                Open FPL
              </button>

            </div>


            <div className="sport-summary-card">

              <div className="sport-icon">
                🏎️
              </div>

              <h3>
                Formula 1
              </h3>

              <p>
                {f1Players.length} drivers
              </p>

              <button
                onClick={() =>
                  switchTab("f1")
                }
              >
                Open F1
              </button>

            </div>


            <div className="sport-summary-card">

              <div className="sport-icon">
                🏈
              </div>

              <h3>
                NFL
              </h3>

              <p>
                {nflPlayers.length} players
              </p>

              <button
                onClick={() =>
                  switchTab("nfl")
                }
              >
                Open NFL
              </button>

            </div>

          </div>

        </main>
      )}


      {/* ============================================= */}
      {/* FPL */}
      {/* ============================================= */}

      {activeTab === "fpl" && (

        <main className="sport-page">

          <div className="sport-title">

            <div>
              <span className="eyebrow">
                FOOTBALL
              </span>

              <h2>
                FPL Player Pool
              </h2>
            </div>

            <div className="result-count">
              {filteredFplPlayers.length} players
            </div>

          </div>


          <input
            className="search-box"
            type="text"
            placeholder="Search FPL players..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />


          <div className="filter-buttons">

            {[
              "ALL",
              "GKP",
              "DEF",
              "MID",
              "FWD"
            ].map((position) => (

              <button
                key={position}
                className={
                  positionFilter === position
                    ? "active-filter"
                    : ""
                }
                onClick={() =>
                  setPositionFilter(position)
                }
              >
                {position}
              </button>

            ))}

          </div>

          <div className="sort-control">

  <label>
    Sort by:
  </label>

  <select
    value={sortBy}
    onChange={(event) =>
      setSortBy(event.target.value)
    }
  >
    <option value="points">
      Points
    </option>

    <option value="price">
      Price
    </option>

    <option value="name">
      Name
    </option>
  </select>

</div>


          <div className="player-list">

            {filteredFplPlayers.map((player) => (

              <div
                className="athlete-row"
                key={player.id}
              >

                <div className="athlete-main">

                  <div className="athlete-badge">
                    ⚽
                  </div>

                  <div>

                    <strong>
                      {player.player_name}
                    </strong>

                    <p>
                      {player.team_name}
                      {" • "}
                      {player.position}
                    </p>

                  </div>

                </div>


                <div className="athlete-stat">

                  <small>
                    Price
                  </small>

                  <strong>
                    £{player.price}m
                  </strong>

                </div>


                <div className="athlete-stat">

                  <small>
                    Points
                  </small>

                  <strong>
                    {player.total_points}
                  </strong>

                </div>


                <button className="draft-button">
                  Draft
                </button>

              </div>

            ))}

          </div>

        </main>
      )}


      {/* ============================================= */}
      {/* F1 */}
      {/* ============================================= */}

      {activeTab === "f1" && (

        <main className="sport-page">

          <div className="sport-title">

            <div>

              <span className="eyebrow">
                FORMULA 1
              </span>

              <h2>
                F1 Driver Pool
              </h2>

            </div>

            <div className="result-count">
              {filteredF1Players.length} drivers
            </div>

          </div>


          <input
            className="search-box"
            type="text"
            placeholder="Search F1 drivers..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />


          <div className="player-list">

            {filteredF1Players.map((driver) => (

              <div
                className="f1-driver-row"
                key={driver.id}
              >

                <div className="athlete-main">

                  <div className="athlete-badge">
                    🏎️
                  </div>

                  <div>

                    <strong>
                      {driver.driver_name || "Unknown Driver"}
                    </strong>

                    <p>
                      {driver.team_name || "Unknown Team"}
                    </p>

                  </div>

                </div>


                <div className="athlete-stat">

                  <small>
                    Rank
                  </small>

                  <strong>
                    P{driver.position_current}
                  </strong>

                </div>


                <div className="athlete-stat">

                  <small>
                    Points
                  </small>

                  <strong>
                    {driver.points_current}
                  </strong>

                </div>


                <div className="athlete-stat">

                  <small>
                    Last Race
                  </small>

                  <strong>
                    +{driver.points_gained}
                  </strong>

                </div>


                <button className="draft-button">
                  Draft
                </button>

              </div>

            ))}

          </div>

        </main>
      )}


      {/* ============================================= */}
      {/* NFL */}
      {/* ============================================= */}

      {activeTab === "nfl" && (

        <main className="sport-page">

          <div className="sport-title">

            <div>

              <span className="eyebrow">
                AMERICAN FOOTBALL
              </span>

              <h2>
                NFL Draft Board
              </h2>

            </div>

            <div className="result-count">
              {filteredNflPlayers.length} players
            </div>

          </div>


          <input
            className="search-box"
            type="text"
            placeholder="Search NFL players..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />


          <div className="filter-buttons">

            {[
              "ALL",
              "QB",
              "RB",
              "WR",
              "TE"
            ].map((position) => (

              <button
                key={position}
                className={
                  positionFilter === position
                    ? "active-filter"
                    : ""
                }
                onClick={() =>
                  setPositionFilter(position)
                }
              >
                {position}
              </button>

            ))}

          </div>


          <div className="player-list">

            {filteredNflPlayers.map((player) => (

              <div
                className="nfl-player-row"
                key={player.id}
              >

                <div className="athlete-main">

                  <div className="athlete-badge">
                    🏈
                  </div>

                  <div>

                    <strong>
                      {player.player_name || "Unknown Player"}
                    </strong>

                    <p>
                      {player.team_name || "FA"}
                      {" • "}
                      {player.position}
                    </p>

                  </div>

                </div>


                <div className="athlete-stat">

                  <small>
                    Position
                  </small>

                  <strong>
                    {player.position}
                  </strong>

                </div>


                <div className="athlete-stat">

                  <small>
                    ADP
                  </small>

                  <strong>
                    {player.adp ?? "-"}
                  </strong>

                </div>


                <button className="draft-button">
                  Draft
                </button>

              </div>

            ))}

          </div>

        </main>
      )}

    </div>
  );
}


export default App;

