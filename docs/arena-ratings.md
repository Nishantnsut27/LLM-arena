# Arena rating methodology

The leaderboard uses chronological Elo ratings as its primary ranking signal.

- Every model starts at 1000 with a K-factor of 32.
- Only voted battles with at least two completed responses are valid.
- In a two-model battle, the winner receives a standard Elo win and the loser a loss.
- In a three-model battle, the winner is compared with each completed loser. The K-factor is divided by the number of losers so larger battles do not create more total rating movement.
- Failed or streaming responses are excluded. Provider failures never count as model-quality losses.
- Ties are not currently supported by voting, but the Elo helper accepts fractional scores so a future tie can use a score of 0.5.
- Models with fewer than 20 valid voted battles are provisional and do not receive a numbered rank.
- Confidence is low below 20 battles, medium from 20 through 99, and high at 100 or more.

Win rate, wins, losses, battle count, vote participation, latency, throughput, token usage, and estimated cost remain visible alongside the rating. Head-to-head results use the same validated battle set and count only direct outcomes where one of the selected models won.
