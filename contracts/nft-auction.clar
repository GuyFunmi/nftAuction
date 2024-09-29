;; NFT Auction Contract

(define-constant err-not-token-owner (err u100))
(define-constant err-auction-not-started (err u101))
(define-constant err-auction-ended (err u102))
(define-constant err-bid-too-low (err u103))
(define-constant err-auction-not-ended (err u104))

(define-data-var auction-end-height uint u0)
(define-data-var current-highest-bid uint u0)
(define-data-var current-highest-bidder (optional principal) none)
(define-data-var auction-token-id uint u0)

(define-public (start-auction (token-id uint) (duration uint) (reserve-price uint))
    (let ((token-owner (unwrap! (nft-get-owner? token-id) err-not-token-owner)))
        (asserts! (is-eq token-owner tx-sender) err-not-token-owner)
        (var-set auction-token-id token-id)
        (var-set auction-end-height (+ block-height duration))
        (var-set current-highest-bid reserve-price)
        (var-set current-highest-bidder none)
        (ok true)))

(define-public (place-bid (amount uint))
    (let ((current-bid (var-get current-highest-bid)))
        (asserts! (< block-height (var-get auction-end-height)) err-auction-ended)
        (asserts! (> amount current-bid) err-bid-too-low)
        (if (is-some (var-get current-highest-bidder))
            (as-contract (stx-transfer? current-bid (unwrap-panic (var-get current-highest-bidder)) tx-sender))
            true)
        (var-set current-highest-bid amount)
        (var-set current-highest-bidder (some tx-sender))
        (stx-transfer? amount tx-sender (as-contract tx-sender))))

(define-public (end-auction)
    (let ((auction-end (var-get auction-end-height))
          (highest-bidder (var-get current-highest-bidder))
          (highest-bid (var-get current-highest-bid))
          (token-id (var-get auction-token-id)))
        (asserts! (>= block-height auction-end) err-auction-not-ended)
        (if (is-some highest-bidder)
            (begin
                (try! (as-contract (nft-transfer? token-id tx-sender (unwrap-panic highest-bidder))))
                (as-contract (stx-transfer? highest-bid tx-sender (unwrap-panic highest-bidder))))
            (ok true))))

(define-read-only (get-auction-info)
    (ok {
        end-height: (var-get auction-end-height),
        highest-bid: (var-get current-highest-bid),
        highest-bidder: (var-get current-highest-bidder),
        token-id: (var-get auction-token-id)
    }))