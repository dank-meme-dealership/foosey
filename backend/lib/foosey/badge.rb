module Foosey
  module Badge
    FIRE = {
      emoji: "\u{1F525}",
      definition: 'On Fire'
    }

    POOP = {
      emoji: "\u{1F4A9}",
      definition: 'Rough Day'
    }

    BABY = {
      emoji: "\u{1F476 1F3FD}",
      definition: 'Newly Ranked'
    }

    MONKEY = {
      emoji: "\u{1F648}",
      definition: "Monkey'd"
    }

    BANANA = {
      emoji: "\u{1F34C}",
      definition: 'Graceful Loss'
    }

    FLEX = {
      emoji: "\u{1F4AA 1F3FC}",
      definition: 'Hefty Win'
    }

    BANDAGE = {
      emoji: "\u{1F915}",
      definition: 'Hospital Bound'
    }

    TOILET = {
      emoji: "\u{1F6BD}",
      definition: 'Get Rekt'
    }

    ZZZ = {
      emoji: "\u{1F4A4}",
      definition: "Snoozin'"
    }

    STREAKS = []
    (3..9).each do |i|
      STREAKS[i] = {
        emoji: "#{i}\u{FE0F}",
        definition: "#{i}-Win Streak"
      }
    end

    STREAKS[10] = {
      emoji: "\u{1F51F}",
      definition: "10-Win Streak"
    }
  end
end