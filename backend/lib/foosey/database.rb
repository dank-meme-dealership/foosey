module Foosey
  def Foosey.database
    @db ||= SQLite3::Database.new 'foosey.db'

    yield @db
  rescue SQLite3::Exception => e
    puts e
    puts e.backtrace
  ensure
    @db.close if @db
    @db = nil
  end
end
