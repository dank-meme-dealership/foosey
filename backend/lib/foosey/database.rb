module Foosey
  def self.database
    @db ||= SQLite3::Database.new 'foosey.db'

    # if there is a transaction ongoing, wait until it's done
    # hope it's not long!
    # sleep(0.01) while @db.transaction_active?

    yield @db
  rescue SQLite3::Exception => e
    puts e
    puts e.backtrace
  end

  def self.close_db
    @db.close if @db
  end

  #TODO: This method might be unnecessary. We should be able to use results_as_hash = true
  def self.create_query_hash(array)
    names = array.shift
    rval = []
    array.each do |r|
      row = {}
      names.each_with_index { |column, idx| row[column] = r[idx] }
      rval << row
    end
    rval
  end
end

#TODO: Not sure if this is the best way to handle this... maybe MySQL will be better?
at_exit do
  Foosey.close_db
end
