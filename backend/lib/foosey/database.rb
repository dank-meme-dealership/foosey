module Foosey
  def self.database
    @db ||= SQLite3::Database.new 'foosey.db'

    # if there is a transaction ongoing, wait until it's done
    # hope it's not long!
    sleep(0.01) while @db.transaction_active?

    yield @db
  rescue SQLite3::Exception => e
    puts e
    puts e.backtrace
  ensure
    @db.close if @db
    @db = nil
  end
end
