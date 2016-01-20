require 'blockspring'
require 'json'

# fuck off
$middle = %{```....................../´¯/) 
....................,/¯../ 
.................../..../ 
............./´¯/'...'/´¯¯`·¸ 
........../'/.../..../......./¨¯\\ 
........('(...´...´.... ¯~/'...') 
.........\\.................'...../ 
..........''...\\.......... _.·´ 
............\\..............( 
..............\\.............\\...```}

$UTC = "-07:00"

$names = []
$admins = ["matttt", "brik"]
$gone = ["daniel", "josh", "jody"]
$interns = ["matt", "brik", "conner", "roger", "adam", "jon"]

# function to return a response object for slack
def make_response(response, attachments = [])
    return {
        text: response,  # send a text response (replies to channel if not blank)
        attachments: attachments,
        link_names: "1",
        username: "foosey",    # overwrite configured username (ex: MyCoolBot)
        icon_url: "http://i.imgur.com/MyGxqRM.jpg", # overwrite configured icon (ex: https://mydomain.com/some/image.png
    }
end

def message_slack(text, attach)
    response = `curl --silent -X POST --data-urlencode 'payload={"channel": "#foosey", "username": "foosey-app", "text": "Game added: #{text}", "icon_emoji": ":foosey:", "attachments": #{attach.to_json}}' https://hooks.slack.com/services/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`
end

# function to make a help message
def help_message()
    help =
%{*Usage:*

To record a singles game:
`foosey Matt 10 Conner 1`

To record a doubles game:
`foosey Greg 10 Erich 10 Blake 9 Daniel 9`

To predict the score of a singles game (based on Elo):
`foosey predict Matt Brik`

To see the full history between you and another player:
`foosey history Will Erich`

To get stats about all players:
`foosey stats`

To undo the last game:
`foosey undo`

To get this help message:
`foosey help`}
    return make_response(help)
end

def succinct_help()
    help = "I couldn't figure out what you were trying to do, to see what I can do try `foosey help`"
    return make_response(help)
end

# function to calculate average scores
def get_avg_scores(games)
    total_scores = Array.new($names.length, 0)
    total_games = Array.new($names.length, 0)
    for g in games.each # for each player
        g_a = g.strip.split(',')[2..-1] # turn the game into an array of scores
        for i in 0 .. g_a.length - 1 # for each player
            # the +1s in here are to prevent off-by-ones because names starts at 0 and scores start at 2 because of timestamp and 
            total_scores[i] += g_a[i].to_i unless g_a[i].to_i == -1 # if they played, increment score
            total_games[i] += 1 unless g_a[i].to_i == -1 # and total num games
        end
    end
        
    avg_score = Array.new()
    averages = ""
    # total_played = ""
    for i in 0 ... $names.length
        if !$gone.include? $names[i]
            avg_score << { :name => $names[i], :avg => total_scores[i] / (total_games[i] * 1.0) } unless total_games[i] == 0
        end
        # total_played += "#{$names[i].capitalize}: #{total_games[i]}\n" unless total_games[i] == 0
    end

    avg_score = avg_score.sort { |a,b| b[:avg] <=> a[:avg] } # cheeky sort

    return avg_score if $app
    
    for i in 0 ... avg_score.length
        averages += "#{avg_score[i][:name].capitalize}: #{'%.2f' % avg_score[i][:avg]}\n"
    end
    
    return averages
    # return make_response("*Here are all of the statistics for your team:*", statistics)
end

def calculate_elo_change(g, elo, total_games)
    
    # quit out unless a 2 or 4 person game
    return elo, total_games if players_in_game(g) != 2 && players_in_game(g) != 4
    
    k_factor = 50 # we can play around with this, but chess uses 15 in most skill ranges

    g_a = g.strip.split(',')[2..-1]
    # variable names from here out are going to be named after those mentioned here:
    # http://www.chess.com/blog/wizzy232/how-to-calculate-the-elo-system-of-rating
    
    # if 2 players
    if players_in_game(g) == 2
        # get indexes
        p_a = g_a.index { |p| p != '-1' }
        p_b = g_a.rindex { |p| p != '-1' }
    
        # then get points
        p_a_p = g_a[p_a].to_i
        p_b_p = g_a[p_b].to_i
    
        # then get previous elos
        r_a = elo[p_a]
        r_b = elo[p_b] 
    
    # if 4 players
    else
        # get indexes of winners
        t_a_p_a = g_a.index { |p| p == '10' }
        t_a_p_b = g_a.rindex { |p| p == '10' }
        
        # get indexes of losers
        t_b_p_a = g_a.index { |p| p != '-1' && p != '10' }
        t_b_p_b = g_a.rindex { |p| p != '-1' && p != '10' }
        
        # then get points
        p_a_p = g_a[t_a_p_a].to_i
        p_b_p = g_a[t_b_p_a].to_i
        
        # then get team elos
        r_a = ((elo[t_a_p_a] + elo[t_a_p_b]) / 2).round
        r_b = ((elo[t_b_p_a] + elo[t_b_p_b]) / 2).round
    end
    
    # do shit
    e_a = 1 / (1 + 10 ** ((r_b - r_a) / 800.to_f))
    e_b = 1 / (1 + 10 ** ((r_a - r_b) / 800.to_f))
    # method 1: winner gets all
    # s_a = p_a_p > p_b_p ? 1 : 0
    # s_b = 1 - s_a
    # method 2: add a weight to winner
    win_weight = 1.2
    s_a = p_a_p / (p_a_p + p_b_p).to_f
    if s_a < 0.5
        s_a = s_a ** win_weight
        s_b = 1 - s_a
    else
        s_b = (1 - s_a) ** win_weight
        s_a = 1 - s_b
    end
    r_a_n = (k_factor * (s_a - e_a)).round
    r_b_n = (k_factor * (s_b - e_b)).round

    # if 2 players
    if players_in_game(g) == 2
        # add back to elos
        elo[p_a] += r_a_n
        elo[p_b] += r_b_n
    
        # add to player total games
        total_games[p_a] += 1
        total_games[p_b] += 1
        
    # if 4 players
    else
        # add winner elos
        elo[t_a_p_a] += r_a_n
        elo[t_a_p_b] += r_a_n
        
        # subtract loser elos
        elo[t_b_p_a] += r_b_n
        elo[t_b_p_b] += r_b_n
        
        # add to player total games
        total_games[t_a_p_a] += 1
        total_games[t_a_p_b] += 1
        total_games[t_b_p_a] += 1
        total_games[t_b_p_b] += 1
    end

    return elo, total_games
end

# calculates singles elo and returns array hash
def get_elos(games, difference)
    elo = Array.new($names.length, 1200)
    total_games = Array.new($names.length, 0)

    games_c = games.dup
    g_i = 0
    for g in games_c.each # adjust players elo game by game
        
        elo, total_games = calculate_elo_change(g, elo, total_games)
            
        g_i += 1
        elo_2nd2Last = elo.dup if g_i == games_c.length - 1
    end
    
    both = []
    both << elo
    both << elo_2nd2Last
    return both if difference != ""
        
    elo_ah = Array.new()
    for i in 0 ... $names.length
        if !$gone.include? $names[i]
            elo_ah << { :name => $names[i], :elo => elo[i] } unless total_games[i] == 0
        end
    end
    elo_ah = elo_ah.sort { |a,b| b[:elo] <=> a[:elo] } # sort the shit out of it, ruby style
    return elo_ah
end

# function to display elo
def get_elo(games)
    elo_ah = get_elos(games, "")
    elo_s = ""
    for i in 0 ... elo_ah.length
        elo_s += "#{elo_ah[i][:name].capitalize}: #{elo_ah[i][:elo]}\n" if !$gone.include? elo_ah[i][:name]
    end

    return elo_s
end

def get_charts(name, games)
    chart_data = []
    elo = Array.new($names.length, 1200)
    total_games = Array.new($names.length, 0)
    real_total_games = 0
    total_wins = 0
    total_score = 0
    index = $names.index(name)
    g_i = 0
    for g in games.each
        date, time = dateTime(g, "%m/%d", "%H:%M")
        elo, total_games = calculate_elo_change(g, elo, total_games)
        g_a = g.strip.split(',')[2..-1] # turn the game into an array of scores
        total_wins += 1 if g_a[index] == '10'
        if g_a[index] != '-1'
            total_score += g_a[index].to_i
            real_total_games += 1
            avg = total_score.to_f / real_total_games.to_f
            percent = total_wins == 0 ? 0 : total_wins.to_f * 100 / real_total_games.to_f
            entry = {
                date: date,
                id: g_i,
                elo: elo[index],
                avg: avg,
                percent: percent
            }
            chart_data << entry
        end
        g_i += 1
    end

    return chart_data
end

def get_difference(thisGame, games)
    both = get_elos(games, "something")
    elo = both[0]
    elo_2nd2Last = both[1]
    g = thisGame.split(',')
    #puts g
    
    # make attachment
    elo_r = [
        pretext: "Elos after that game:",
        fields: []
    ]
    
    # calculate the changes in elos
    g_i = 0
    for elo2 in elo_2nd2Last.each
        diff = (elo[g_i].to_i - elo2.to_i)
        p = diff < 0 ? '' : '+'
        
        thisPlayer = {
            title: "#{$names[g_i].capitalize}",
            value: "#{elo[g_i]} (#{p}#{diff})",
            short: true
        }
        #puts g[g_i]
        elo_r[0][:fields] << thisPlayer if g[g_i] != '-1'
        
        g_i += 1
    end
    
    return elo_r
end

# returns the number of players in a specified game
# pass a line from games.csv to this
def players_in_game(game)
    g_a = game.strip.split(',')[2..-1]
    players = 0
    for g in g_a.each
        players += 1 if g != '-1'
    end
    return players
end

# function to calculate stats breh
def stats(content, cmd)
    games = content.split("\n")[1..-1] # convert all games in csv to array, one game per index
    elo = get_elo(games)
    avg = get_avg_scores(games)
    percent = total(games)
    
    return make_response(avg) if cmd.start_with? "average"
    
    stats = [
        fields: 
        [
            {
                title: "Elo Rating:",
                value: elo,
                short: true
            },
            {
                title: "Average Score:",
                value: avg,
                short: true
            },
            {
                title: "Percent games won:",
                value: percent,
                short: true
            }
        ]
    ]
    
    return make_response("*Here are all of the stats for your team:*", stats)
    
end

def history(player1, player2, content)
    if player1.include? "&"
        team1 = player1.split("&")
        team2 = player2.split("&")
        p1Index = $names.find_index(team1[0])
        p2Index = $names.find_index(team1[1])
        p3Index = $names.find_index(team2[0])
        p4Index = $names.find_index(team2[1])
        player1 = "#{team1[0].capitalize}&#{team1[1].capitalize}"
        player2 = "#{team2[0].capitalize}&#{team2[1].capitalize}"
        history4 = true
    else
        p1Index = $names.find_index(player1)
        p2Index = $names.find_index(player2)
    end
    games = content.split("\n")[1..-1] # convert all games in csv to array, one game per index
    text = ""
    for g in games.each
        thisGame = g.split(",")
        local = Time.at(thisGame.shift.to_i).getlocal($UTC)
        date = local.strftime("%m/%d/%Y")
        name = thisGame.shift
        numPlayers = players_in_game(g)
        if (numPlayers == 2 && thisGame[p1Index] != '-1' && thisGame[p2Index] != '-1')
            text = "#{date} -\t#{player1.capitalize}: #{thisGame[p1Index]}\t#{player2.capitalize}: #{thisGame[p2Index]}\n" + text
        elsif (history4 && numPlayers == 4 && thisGame[p1Index] != '-1' && thisGame[p2Index] != '-1' && thisGame[p3Index] != '-1' && thisGame[p4Index] != '-1')
            text = "#{date} -\t#{player1}: #{thisGame[p1Index]}\t#{player2}: #{thisGame[p3Index]}\n" + text
        end
    end
    history = [{
        pretext: "Full game history between #{player1.capitalize} and #{player2.capitalize}:",
        text: text
    }]
    return history
end

# get a set number of games as json
# start is the index to start at, starting with the most recent game
# limit is the number of games to return from that starting point
# allHistory(content, 0, 50) would return the 50 most recent games
def allHistory(content, start, limit)
    games = content.split("\n")[1..-1] # convert csv to all games
    start = games.length - start.to_i - 1
    start = -1 if start < 0 || start >= games.length
    limit = limit == '' ? 0 : games.length - limit.to_i
    limit = 0 if limit < 0 || limit > start
    games = games[limit..start] # limit the number of games returned
    allGames = []
    id = limit;
    for g in games.each
        date, time = dateTime(g, "%m/%d/%Y", "%H:%M")
        players = []
        game = g.split(",")[2..-1]
        i = 0
        for p in game.each
            if p != '-1'
                players << {
                    name: $names[i].capitalize,
                    score: p
                }
            end
            i += 1
        end
        allGames.unshift({
            id: id,
            date: date,
            time: time,
            players: players
        })
        id += 1;
    end
    return allGames
end

def record_safe(player1, player2, content)
    return make_response("Please pass two different valid names to `foosey history`") if player1 == player2 || !$names.include?(player1) || !$names.include?(player2)
    record = record(player1, player2, content)
    history = history(player1, player2, content)
    for item in history.each
        record << item
    end
    return make_response(" ", record)
end

# function to return the record between two players as an attachment
def record(player1, player2, content)
    if player1.include? "&"
        team1 = player1.split("&")
        team2 = player2.split("&")
        p1Index = $names.find_index(team1[0])
        p2Index = $names.find_index(team1[1])
        p3Index = $names.find_index(team2[0])
        p4Index = $names.find_index(team2[1])
        player1 = "#{team1[0].capitalize}&#{team1[1].capitalize}"
        player2 = "#{team2[0].capitalize}&#{team2[1].capitalize}"
        history4 = true
    else
        p1Index = $names.find_index(player1)
        p2Index = $names.find_index(player2)
        player1 = player1.capitalize
        player2 = player2.capitalize
        history2 = true
    end
    games = content.split("\n")[1..-1] # convert all games in csv to array, one game per index
    team1Score = 0
    team2Score = 0
    for g in games.each
        thisGame = g.split(",")[2..-1]
        numPlayers = players_in_game(g)
        if (history2 && numPlayers == 2 && thisGame[p1Index] != '-1' && thisGame[p2Index] != '-1')
            if (thisGame[p1Index].to_i > thisGame[p2Index].to_i)
                team1Score += 1
            else
                team2Score += 1
            end
        elsif (history4 && numPlayers == 4 && thisGame[p1Index] != '-1' && thisGame[p2Index] != '-1' && thisGame[p3Index] != '-1' && thisGame[p4Index] != '-1' && thisGame[p1Index] == thisGame[p2Index] && thisGame[p3Index] == thisGame[p4Index])
            if (thisGame[p1Index].to_i > thisGame[p3Index].to_i)
                team1Score += 1
            else
                team2Score += 1
            end
        end
    end

    record = [
        pretext: "Current record between #{player1} and #{player2}:",
        fields: [
            {
                title: "#{player1}",
                value: "#{team1Score}",
                short: true
            },
            {
                title: "#{player2}",
                value: "#{team2Score}",
                short: true
            }
        ]
    ]
    return record
end

# function to predict the score between two players
def predict(content, cmd)
    games = content.split("\n")[1..-1] # convert all games in csv to array, one game per index
    elo_ah = get_elos(games, "")
    players = cmd.split(" ")
    return make_response("Please pass two different valid names to `foosey predict`") if
        players.length != 2 || elo_ah.index { |p| p[:name] == players[0]}.nil? || elo_ah.index { |p| p[:name] == players[1]}.nil? || players[0] == players[1]
    elo_ah.keep_if { |p| p[:name] == players[0] || p[:name] == players[1]} # this array will already be in order by elo
    player_a = elo_ah[0] # higher elo
    player_b = elo_ah[1] # lower elo
    r_a = player_a[:elo]
    r_b = player_b[:elo]
    win_weight = 1.2
    e_b = 1 / (1 + 10 ** ((r_a - r_b) / 800.to_f))
    i = 0
    while i < 10 do
        e = (i / (i + 10).to_f) ** win_weight
        return make_response("Predicted score: #{player_a[:name].capitalize} 10 #{player_b[:name].capitalize} #{i}") if
            e >= e_b
        i += 1
    end
    return make_response("Predicted score: To close to tell!")
end

# function to undo the last move
def undo(content, github_user, github_pass)
    games = content.split("\n")[1..-1] # convert all games in csv to array, one game per index
    last = games.pop.split(",")[1..-1]
    username = last.shift
    response = "Removed the game added by #{username}:"
    i = 0;
    content = content.split("\n")[0...-1].join("\n")
    for g in last.each
        response += "\n#{$names[i].capitalize}: #{g}" if g != '-1'
        i += 1
    end
    output = update_file_in_gist(github_user, github_pass, "Foosbot Data", "games.csv", content)
    # i think documentation_url only pops up on errors
    return make_response("Failed to remove game @matttt @brik") if output.include? "documentation_url" 
    return make_response(response)
end

# function to remove specific game
def remove(id, content, github_user, github_pass)
    games = content.split("\n")
    toRemove = games.at(id.to_i + 1)
    games.delete_at(id.to_i + 1)
    content = games.join("\n")
    output = update_file_in_gist(github_user, github_pass, "Foosbot Data", "games.csv", content)
    response = `curl --silent -X POST --data-urlencode 'payload={"channel": "@matttt", "username": "foosey", "text": "Someone used the app to remove:\n#{toRemove}", "icon_emoji": ":foosey:"}' https://hooks.slack.com/services/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`
    return "Removed"
end

# function to verify the input from slack
def verify_input(text)
    game = text.split(' ')
    if game.length % 2 != 0 || game.length < 4 # at least two players
        return "help"
    end
    games_n = game.values_at(* game.each_index.select {|i| i.even?}) # oh ruby, you so fine
    return "No duplicate players in a game!" if games_n.length > games_n.map{|g| g}.uniq.length
    for i in 0..game.length-1
        if i % 2 == 0 # names
            return "No user named `#{game[i]}` being logged." unless $names.include?(game[i])
        else
        return "help" unless game[i].match(/^[-+]?[0-9]*$/)
        return "Please enter whole numbers between 0 and 10." unless game[i].to_i < 11 && game[i].to_i >= 0
        end
    end
    return "good"
end

def getInsult()
    insult = `curl --silent http://www.insultgenerator.org/ | grep "<br><br>"`
    insult = insult.split("<br><br>")[1].split("<")[0].gsub('&nbsp;', ' ').gsub('&#44;', ',')
    return insult
end

def getPlayers(names)
    players = []
    for p in names.each
        players << {
            name: p,
            selected: false
        }
    end
    return players
end

def addUser(name, content)
    newContent = "#{content.lines.first.gsub("\n", '')},#{name}"
    split = content.split("\n")[1..-1]
    for i in 0..split.length-1
        newContent += "\n#{split[i].gsub("\n", '')},-1"
    end
    return newContent;
end

def total(games)
    total_wins = Array.new($names.length, 0)
    total_games = Array.new($names.length, 0)
    for g in games.each # for each player
        g_a = g.strip.split(',')[2..-1] # turn the game into an array of scores
        for i in 0 .. g_a.length - 1 # for each player
            # the +1s in here are to prevent off-by-ones because names starts at 0 and scores start at 1 because of timestamp
            total_wins[i] += 1 if g_a[i].to_i == 10 # if they won, increment wins
            total_games[i] += 1 unless g_a[i].to_i == -1 # increment total games
        end
    end
     
    totals = Array.new
    
    stats = ""
    for i in 0..$names.length - 1
        if !$gone.include? $names[i]
            wins = total_wins[i] == 0 ? 0 : (total_wins[i].to_f*100 / total_games[i].to_f)
            totals << { :name => $names[i], :percent => wins } unless total_games[i] == 0
        end
    end
    
    totals = totals.sort { |a,b| b[:percent] <=> a[:percent] } # cheeky sort

    return totals if $app
    
    for i in 0..totals.length - 1
        stats += "#{totals[i][:name].capitalize}: #{totals[i][:percent].to_i}%\n"
    end
    
    return stats
end

# function to return date and time
def dateTime(g, dateFormat, timeFormat)
    thisGame = g.split(",")
    local = Time.at(thisGame.shift.to_i).getlocal($UTC)
    date = local.strftime(dateFormat)
    time = local.strftime(timeFormat)

    return date, time
end

# Returns the contents of the specified file in the specified gist as a string
def get_file_from_gist(github_user, github_pass, gist_name, file_name)
    json = `curl --silent --user "#{github_user}:#{github_pass}" https://api.github.com/users/#{github_user}/gists`
    parsed = JSON.parse(json)

    # find the specified gist
    raw_url = ""
    i = 0
    while i < parsed.length && raw_url == "" do
        raw_url = parsed[i]["files"]["#{file_name}"]["raw_url"] if parsed[i]["description"] == gist_name
        i+=1
    end
    
    return "" if raw_url == ""

    return `curl --silent --user "#{github_user}:#{github_pass}" #{raw_url}`
end

# changes the contents of a file in a gist to the specified string
def update_file_in_gist(github_user, github_pass, gist_name, file_name, content)
    json = `curl --silent --user "#{github_user}:#{github_pass}" https://api.github.com/users/#{github_user}/gists`
    parsed = JSON.parse(json)

    gist_url = ""
    i = 0
    while i < parsed.length && gist_url == "" do
        gist_url = parsed[i]["url"] if parsed[i]["description"] == gist_name
        i+=1
    end

    # very confusing mess of characters that makes new json for the patch
    # TODO: use JSON gem to build this (I'm sure it's possible)
    data = '{"description":"' + gist_name + '","files":{"' + file_name + '":{"content":"' + content.gsub("\n", '\n') + '"}}}'
    return `curl --silent --user "#{github_user}:#{github_pass}" -X PATCH --data \'#{data}\' #{gist_url}`
end

def webhook(team_domain, service_id, token, user_name, team_id, user_id, channel_id, timestamp, channel_name, text, trigger_word, raw_text, github_user, github_pass)
    
    #if (channel_name != "foosey" && channel_name != "robothouse")
    #    insult = getInsult()
    #    return make_response("#{user_name}, please stop bothering me. #{insult}")
    #end
    
    # Get latest paste's content
    content = get_file_from_gist(github_user, github_pass, "Foosbot Data", "games.csv")
    $names = content.lines.first.strip.split(',')[2..-1] # drop the first two items, because they're "time" and "who"
    games = content.split("\n")[1..-1]
    
    # Clean up text and set args
    text ||= ""
    text = text.downcase.gsub(":", "")
    args = text.split(" ")
    
    # App specific cases
    if $app
        if text.start_with? "charts"
            return {
                charts: get_charts(args[1], games)
            }
        elsif text.start_with? "leaderboard"
            return {
                elos: get_elos(games, ""),
                avgs: get_avg_scores(games),
                percent: total(games)
            }
        elsif text.start_with? "history"
            return {
                games: allHistory(content, args[1], args[2])
            }
        elsif text.start_with? "players"
            return {
                players: getPlayers($names - $gone)
            }
        elsif text.start_with? "remove"
            return {
                response: remove(args[1], content, github_user, github_pass)
            }
        end
    end
        
    # Cases other than adding a game
    if text.start_with? "help"
        return help_message()
    elsif text.start_with? "stats"
        return stats(content, text["stats".length..text.length].strip)
    elsif text.start_with? "predict"
        return predict(content, text["predict".length..text.length].strip)
    elsif text.start_with? "easter"
        return make_response($middle)
    elsif text.start_with? "undo"
        return undo(content, github_user, github_pass)
    elsif text.start_with? "history"
        return record_safe(args[1], args[2], content)
    elsif text.start_with? "record"
        return make_response("`foosey record` has been renamed `foosey history`")
    elsif text.start_with? "add"
        return succinct_help() unless $admins.include? user_name
        content = addUser(args[1], content)
        update_file_in_gist(github_user, github_pass, "Foosbot Data", "games.csv", content)
        return make_response("Player added!")
    end

    # Verify data
    result = verify_input(text);
    if result != "good"
        if result == "help"
            return succinct_help()
        else
            return make_response(result)
        end
    end
    
    # Add last game from slack input
    now = Time.now.to_i
    game = text.split(' ') # get the game information
    i = 0
    new_game = Array.new($names.length + 2, -1)
    new_game[0] = now # set first column to timestamp
    new_game[1] = "@#{user_name}" #set second column to slack username
    while i < game.length
        name_column = $names.find_index(game[i]) + 2 # get column of person's name
        new_game[name_column] = game[i + 1].to_i # to_i should be safe here since we've verified input earlier
        i += 2
    end
    lastGame = content.split("\n").pop.split(",")[2..-1].join(",")
    lastGameUsername = content.split("\n").pop.split(",")[1]
    thisGame = new_game[2..-1].join(',') # complicated way to join
    thisGameJoined = new_game.join(',')
    
    content += "\n" + thisGameJoined # add this game to the paste content

    # set up attachments
    attach = []
    players = players_in_game(thisGameJoined)
    if (players == 2 || players == 4)
        games = content.split("\n")[1..-1]
        
        # get elo change
        elo_change = get_difference(thisGame, games)
        
        # if 2 players
        if players == 2
            # get record
            record = record(game[0], game[2], content)
        # if 4 players
        else
            # get record
            team1 = []
            team2 = []
            i = 0
            while i < game.length do
                if game[i+1] == '10'
                team1 << game[i]
                else
                    team2 << game[i]
                end
                i += 2
            end
            record = record("#{team1.join("&")}", "#{team2.join("&")}", content)
        end
        
        # add them to the attachments
        attach << elo_change[0]
        attach << record[0]
    end
    output = ""
    output = update_file_in_gist(github_user, github_pass, "Foosbot Data", "games.csv", content) unless user_id == 'USLACKBOT'
    # i think documentation_url only pops up on errors
    return make_response("Failed to add game @matttt @brik") if output.include? "documentation_url" 

    message_slack(text, attach) if $app

    if (lastGame != thisGame)
        return make_response("Game added!", attach)
    else
        return make_response("Game added!\nThis game has the same score as the last game that was added. If you added this game in error you can undo this action.", attach)
    end

end 

block = lambda do |request, response|
    team_domain = request.params['team_domain']
    service_id = request.params['service_id']
    token = request.params['token']
    user_name = request.params['user_name']
    team_id = request.params['team_id']
    user_id = request.params['user_id']
    channel_id = request.params['channel_id']
    timestamp = request.params['timestamp']
    channel_name = request.params['channel_name']
    raw_text = text = request.params['text']
    trigger_word = request.params['trigger_word']
    github_user = request.params['GITHUB_USER']
    github_pass = request.params['GITHUB_PASS']
    
    # optional app flag
    $app = true if request.params['device'] == 'app'
    
    # ignore all bot messages
    # return if user_id == 'USLACKBOT'

    # Strip out trigger word from text if given
    if trigger_word
        text = text[trigger_word.length..text.length].strip
    end

    # Execute bot function
    output = webhook(team_domain, service_id, token, user_name, team_id, user_id, channel_id, timestamp, channel_name, text, trigger_word, raw_text, github_user, github_pass)
    # set any keys that aren't blank
    output.keys.each do |k|
        response.addOutput(k, output[k]) unless output[k].nil? or output[k].empty?
    end

    response.end
end

Blockspring.define(block)