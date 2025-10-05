(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-HASH u101)
(define-constant ERR-INVALID-TITLE u102)
(define-constant ERR-INVALID-DESCRIPTION u103)
(define-constant ERR-INVALID-ORIGIN u104)
(define-constant ERR-INVALID-CATEGORY u105)
(define-constant ERR-VARIETY-ALREADY-EXISTS u106)
(define-constant ERR-VARIETY-NOT-FOUND u107)
(define-constant ERR-INVALID-TIMESTAMP u108)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u109)
(define-constant ERR-INVALID-CLIMATE u110)
(define-constant ERR-INVALID-YIELD u111)
(define-constant ERR-VARIETY-UPDATE-NOT-ALLOWED u112)
(define-constant ERR-INVALID-UPDATE-PARAM u113)
(define-constant ERR-MAX-VARIETIES-EXCEEDED u114)
(define-constant ERR-INVALID-TRAITS u115)
(define-constant ERR-INVALID-RESISTANCE u116)
(define-constant ERR-INVALID-MATURITY u117)
(define-constant ERR-INVALID-LOCATION u118)
(define-constant ERR-INVALID-STATUS u119)
(define-constant ERR-INVALID-CREATOR u120)

(define-data-var next-variety-id uint u0)
(define-data-var max-varieties uint u10000)
(define-data-var registration-fee uint u500)
(define-data-var authority-contract (optional principal) none)

(define-map varieties
  uint
  {
    hash: (buff 32),
    title: (string-ascii 100),
    description: (string-utf8 500),
    origin: (string-utf8 100),
    category: (string-ascii 50),
    climate: (string-ascii 50),
    yield-potential: uint,
    traits: (list 10 (string-ascii 50)),
    resistance: (string-ascii 100),
    maturity-days: uint,
    timestamp: uint,
    creator: principal,
    location: (string-utf8 100),
    status: bool
  }
)

(define-map varieties-by-hash
  (buff 32)
  uint)

(define-map variety-updates
  uint
  {
    update-title: (string-ascii 100),
    update-description: (string-utf8 500),
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-variety (id uint))
  (map-get? varieties id)
)

(define-read-only (get-variety-updates (id uint))
  (map-get? variety-updates id)
)

(define-read-only (is-variety-registered? (hash (buff 32)))
  (is-some (map-get? varieties-by-hash hash))
)

(define-private (validate-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-HASH))
)

(define-private (validate-title (title (string-ascii 100)))
  (if (and (> (len title) u0) (<= (len title) u100))
      (ok true)
      (err ERR-INVALID-TITLE))
)

(define-private (validate-description (desc (string-utf8 500)))
  (if (<= (len desc) u500)
      (ok true)
      (err ERR-INVALID-DESCRIPTION))
)

(define-private (validate-origin (origin (string-utf8 100)))
  (if (<= (len origin) u100)
      (ok true)
      (err ERR-INVALID-ORIGIN))
)

(define-private (validate-category (cat (string-ascii 50)))
  (if (or (is-eq cat "vegetable") (is-eq cat "fruit") (is-eq cat "grain") (is-eq cat "herb"))
      (ok true)
      (err ERR-INVALID-CATEGORY))
)

(define-private (validate-climate (climate (string-ascii 50)))
  (if (or (is-eq climate "tropical") (is-eq climate "temperate") (is-eq climate "arid") (is-eq climate "cold"))
      (ok true)
      (err ERR-INVALID-CLIMATE))
)

(define-private (validate-yield (yield uint))
  (if (> yield u0)
      (ok true)
      (err ERR-INVALID-YIELD))
)

(define-private (validate-traits (traits (list 10 (string-ascii 50))))
  (if (<= (len traits) u10)
      (ok true)
      (err ERR-INVALID-TRAITS))
)

(define-private (validate-resistance (res (string-ascii 100)))
  (if (<= (len res) u100)
      (ok true)
      (err ERR-INVALID-RESISTANCE))
)

(define-private (validate-maturity (days uint))
  (if (and (> days u0) (<= days u365))
      (ok true)
      (err ERR-INVALID-MATURITY))
)

(define-private (validate-location (loc (string-utf8 100)))
  (if (<= (len loc) u100)
      (ok true)
      (err ERR-INVALID-LOCATION))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-principal (p principal))
  (if (not (is-eq p 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-INVALID-CREATOR))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-varieties (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-MAX-VARIETIES-EXCEEDED))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set max-varieties new-max)
    (ok true)
  )
)

(define-public (set-registration-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set registration-fee new-fee)
    (ok true)
  )
)

(define-public (register-variety
  (seed-hash (buff 32))
  (title (string-ascii 100))
  (description (string-utf8 500))
  (origin (string-utf8 100))
  (category (string-ascii 50))
  (climate (string-ascii 50))
  (yield-potential uint)
  (traits (list 10 (string-ascii 50)))
  (resistance (string-ascii 100))
  (maturity-days uint)
  (location (string-utf8 100))
)
  (let (
        (next-id (var-get next-variety-id))
        (current-max (var-get max-varieties))
        (authority (var-get authority-contract))
      )
    (asserts! (< next-id current-max) (err ERR-MAX-VARIETIES-EXCEEDED))
    (try! (validate-hash seed-hash))
    (try! (validate-title title))
    (try! (validate-description description))
    (try! (validate-origin origin))
    (try! (validate-category category))
    (try! (validate-climate climate))
    (try! (validate-yield yield-potential))
    (try! (validate-traits traits))
    (try! (validate-resistance resistance))
    (try! (validate-maturity maturity-days))
    (try! (validate-location location))
    (asserts! (is-none (map-get? varieties-by-hash seed-hash)) (err ERR-VARIETY-ALREADY-EXISTS))
    (let ((authority-recipient (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
      (try! (stx-transfer? (var-get registration-fee) tx-sender authority-recipient))
    )
    (map-set varieties next-id
      {
        hash: seed-hash,
        title: title,
        description: description,
        origin: origin,
        category: category,
        climate: climate,
        yield-potential: yield-potential,
        traits: traits,
        resistance: resistance,
        maturity-days: maturity-days,
        timestamp: block-height,
        creator: tx-sender,
        location: location,
        status: true
      }
    )
    (map-set varieties-by-hash seed-hash next-id)
    (var-set next-variety-id (+ next-id u1))
    (print { event: "variety-registered", id: next-id })
    (ok next-id)
  )
)

(define-public (update-variety
  (variety-id uint)
  (update-title (string-ascii 100))
  (update-description (string-utf8 500))
)
  (let ((variety (map-get? varieties variety-id)))
    (match variety
      v
        (begin
          (asserts! (is-eq (get creator v) tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-title update-title))
          (try! (validate-description update-description))
          (map-set varieties variety-id
            {
              hash: (get hash v),
              title: update-title,
              description: update-description,
              origin: (get origin v),
              category: (get category v),
              climate: (get climate v),
              yield-potential: (get yield-potential v),
              traits: (get traits v),
              resistance: (get resistance v),
              maturity-days: (get maturity-days v),
              timestamp: block-height,
              creator: (get creator v),
              location: (get location v),
              status: (get status v)
            }
          )
          (map-set variety-updates variety-id
            {
              update-title: update-title,
              update-description: update-description,
              update-timestamp: block-height,
              updater: tx-sender
            }
          )
          (print { event: "variety-updated", id: variety-id })
          (ok true)
        )
      (err ERR-VARIETY-NOT-FOUND)
    )
  )
)

(define-public (get-variety-count)
  (ok (var-get next-variety-id))
)

(define-public (check-variety-existence (hash (buff 32)))
  (ok (is-variety-registered? hash))
)