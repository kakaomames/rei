@FunctionalInterface
public interface aml<T, V> {
   V get(amt<T> var1);

   static <T, V> aml<T, V> fixed(V $$0) {
      return ($$1) -> {
         return $$0;
      };
   }
}
