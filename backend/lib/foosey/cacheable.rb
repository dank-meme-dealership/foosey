module Foosey
  @cache = Hash.new { |h, k| h[k] = {} }

  def self.cache
    @cache
  end

  class Cacheable
    def self.new(*args)
      @cache_id = args[0]
      @cache_name = name
      Foosey.cache[@cache_name][@cache_id] || begin
        obj = allocate
        obj.send(:initialize, *args)
        Foosey.cache[@cache_name][@cache_id] = obj
      end
    end

    def invalidate
      Foosey.cache[@cache_name].delete(@cache_id)
    end
  end
end
