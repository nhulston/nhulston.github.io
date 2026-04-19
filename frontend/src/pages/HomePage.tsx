const condos = [
  {
    alt: "ski in ski out lodge at mountain village park city",
    cta: "Sleeps 13, Learn More",
    heading: "The Taylor: Luxury 4 bedroom, 3 bath slopeside",
    href: "https://thelodgeatmountainvillage.bookeddirectly.com/g/park-city/the-taylor-rare-remodeled-park-city-ski-in-out-magnificent-4-br3ba-lux/241e53",
    image: "/images/park-city-condo3.webp",
  },
  {
    alt: "luxury park city condo, on the mountain slopeside",
    cta: "Sleeps 13, Learn More",
    heading: "The Margot: Rare 4 bedroom, 3 bath slopeside",
    href: "https://thelodgeatmountainvillage.bookeddirectly.com/g/park-city/just-remodeled-the-margot-rare-ski-in-ski-out-spacious-luxury-and-comfort/fbb760",
    image: "/images/park-city-condo1.webp",
  },
  {
    alt: "luxury condo at park city, next to ski resort",
    cta: "Sleeps 7, Learn More",
    heading: "The Draper: Extraordinary 2 bedroom, 2 bath with Giant private porch, slopeside",
    href: "https://thelodgeatmountainvillage.bookeddirectly.com/g/park-city/just-remodeled-the-draper-rare-ski-in-out-spacious-luxury-huge-porch-views/25af7f",
    image: "/images/park-city-condo2.webp",
  },
  {
    alt: "lodge at mountain village condo",
    cta: "Sleeps 8, Learn More",
    heading: "The Hamilton: Exceptional 2 bedroom, 2 bath slopeside with Stunning Ski Mountain Views",
    href: "https://thelodgeatmountainvillage.bookeddirectly.com/g/park-city/the-hamilton-rare-ski-in-out-incredible-views-pool-skating-rink-best-park-city-location-stunning/162c7f",
    image: "/images/park-city-condo4.webp",
  },
];

const featureBullets = [
  "Genuine slopeside access - ski right into your condo building",
  "Condos near ski lifts, only steps from five chairlifts and the Park City Mountain ski school meet up",
  "Surrounded by restaurants, coffee shops, and shops in this Park City Lodging",
  "Heated indoor/outdoor pools & hot tubs with sweeping mountain views",
  "On-site ice-skating rink in the complex",
  "Fast, free Wi-Fi",
  "In-unit washer/dryer and fireplace",
  "Well-lit underground parking",
  "Well-equipped cardio & weight center plus sauna and steam all in the building",
  "Amazing alpine views",
];

export function HomePage() {
  return (
    <>
      <div id="header-div">
        <img
          alt="ski in ski out park city. the lodge at park city mountain resort"
          fetchPriority="high"
          src="/images/park-city-ski-resort.webp"
        />

        <h1 className="headline-bottom">
          An Unforgettable Park City
          <br />
          Ski in Ski out Vacation!
        </h1>
        <div className="button-div">
          <a
            href="https://thelodgeatmountainvillage.bookeddirectly.com/"
            rel="noreferrer"
            target="_blank"
          >
            BOOK NOW
          </a>
        </div>
      </div>

      <div className="row">
        <div className="column">
          <div id="text-wrapper">
            <h2>Ski-In Ski-Out Park City Condos at The Lodge at Mountain Village</h2>
            <p>
              ParkCitySkiOut offers premium <strong>Park City vacation rentals</strong>{" "}
              travelers love, true <strong>ski-in ski-out condos Park City Mountain Resort</strong>{" "}
              right at <strong>The Lodge at Park City Mountain Village</strong>.
            </p>
            <ul>
              {featureBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              Book direct with ParkCitySkiOut for the best selection of
              <br />
              <strong>Park City vacation rentals</strong> at The Lodge at Mountain Village.
            </p>
            <div className="button-div">
              <a
                href="https://thelodgeatmountainvillage.bookeddirectly.com/"
                rel="noreferrer"
                target="_blank"
              >
                BOOK NOW
              </a>
            </div>
          </div>
        </div>
        <div className="column" id="column_image">
          <img alt="park city map mountain resort lodge ski" src="/images/park-city-map.webp" />
        </div>
      </div>

      <h2 className="display-header">Choose the condo that is best for you</h2>

      {condos.map((condo) => (
        <div key={condo.heading}>
          <img alt={condo.alt} className="image" src={condo.image} />
          <h3>{condo.heading}</h3>
          <a className="redirect" href={condo.href} rel="noreferrer" target="_blank">
            {condo.cta}
          </a>
        </div>
      ))}

      <div id="concierge-section">
        <p>
          For guests looking to elevate their stay, we&apos;re pleased to recommend{" "}
          <strong>Leigh</strong>,
          <br />
          a trusted local luxury concierge based right here in Park City.{" "}
          <a
            href="https://www.campfiresandconcierges.com/park-city-concierge/"
            rel="noreferrer"
            target="_blank"
          >
            Learn more
          </a>
        </p>
      </div>

      <h2 className="display-header">Connect with us</h2>
      <a
        href="https://www.facebook.com/The-Lodge-at-Park-City-Mountain-Resort-105341847843419/"
        rel="noreferrer"
        target="_blank"
      >
        <img alt="park city mountain resort facebook" id="facebook" src="/images/facebook.png" />
      </a>
    </>
  );
}
