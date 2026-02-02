import com.mojang.datafixers.util.Pair;
import com.mojang.serialization.Codec;
import com.mojang.serialization.DataResult;
import com.mojang.serialization.DynamicOps;
import com.mojang.serialization.Lifecycle;
import java.util.Optional;

public final class amr<E> implements Codec<jd<E>> {
   private final amt<? extends jq<E>> a;

   public static <E> amr<E> a(amt<? extends jq<E>> $$0) {
      return new amr($$0);
   }

   private amr(amt<? extends jq<E>> $$0) {
      this.a = $$0;
   }

   public <T> DataResult<T> a(jd<E> $$0, DynamicOps<T> $$1, T $$2) {
      if ($$1 instanceof ams) {
         ams<?> $$3 = (ams)$$1;
         Optional<jg<E>> $$4 = $$3.a(this.a);
         if ($$4.isPresent()) {
            if (!$$0.a((jg)$$4.get())) {
               return DataResult.error(() -> {
                  return "Element " + String.valueOf($$0) + " is not valid in current registry set";
               });
            }

            return (DataResult)$$0.d().map(($$2x) -> {
               return amo.a.encode($$2x.a(), $$1, $$2);
            }, ($$0x) -> {
               return DataResult.error(() -> {
                  return "Elements from registry " + String.valueOf(this.a) + " can't be serialized to a value";
               });
            });
         }
      }

      return DataResult.error(() -> {
         return "Can't access registry " + String.valueOf(this.a);
      });
   }

   public <T> DataResult<Pair<jd<E>, T>> decode(DynamicOps<T> $$0, T $$1) {
      if ($$0 instanceof ams) {
         ams<?> $$2 = (ams)$$0;
         Optional<je<E>> $$3 = $$2.b(this.a);
         if ($$3.isPresent()) {
            return amo.a.decode($$0, $$1).flatMap(($$1x) -> {
               amo $$2 = (amo)$$1x.getFirst();
               return ((DataResult)((je)$$3.get()).a(amt.a(this.a, $$2)).map(DataResult::success).orElseGet(() -> {
                  return DataResult.error(() -> {
                     return "Failed to get element " + String.valueOf($$2);
                  });
               })).map(($$1) -> {
                  return Pair.of($$1, $$1x.getSecond());
               }).setLifecycle(Lifecycle.stable());
            });
         }
      }

      return DataResult.error(() -> {
         return "Can't access registry " + String.valueOf(this.a);
      });
   }

   public String toString() {
      return "RegistryFixedCodec[" + String.valueOf(this.a) + "]";
   }

   // $FF: synthetic method
   public DataResult encode(final Object param1, final DynamicOps param2, final Object param3) {
      return this.a((jd)var1, var2, var3);
   }
}
