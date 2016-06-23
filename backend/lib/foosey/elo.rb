module Foosey
  def self.elo_delta(rating_a, score_a, rating_b, score_b,
                     k_factor, win_weight, max_score)
    # elo math please never quiz me on this
    expected_a = 1 / (1 + 10**((rating_b - rating_a) / 800.to_f))
    expected_b = 1 / (1 + 10**((rating_a - rating_b) / 800.to_f))

    outcome_a = score_a / (score_a + score_b).to_f
    if outcome_a < 0.5
      # a won
      outcome_a **= win_weight
      outcome_b = 1 - outcome_a
    else
      # b won
      outcome_b = (1 - outcome_a)**win_weight
      outcome_a = 1 - outcome_b
    end

    # divide elo change to be smaller if it wasn't a full game to 10
    ratio = [score_a, score_b].max / max_score.to_f

    # calculate elo change
    delta_a = (k_factor * (outcome_a - expected_a) * ratio).round
    delta_b = (k_factor * (outcome_b - expected_b) * ratio).round
    [delta_a, delta_b]
  end
end