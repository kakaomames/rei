import com.mojang.datafixers.util.Pair;
import com.mojang.serialization.Codec;
import com.mojang.serialization.DataResult;
import com.mojang.serialization.DynamicOps;
import com.mojang.serialization.Lifecycle;
import java.util.Optional;

public final class amq<E> implements Codec<jd<E>> {
   private final amt<? extends jq<E>> a;
   private final Codec<E> b;
   private final boolean c;

   public static <E> amq<E> a(amt<? extends jq<E>> $$0, Codec<E> $$1) {
      return a($$0, $$1, true);
   }

   public static <E> amq<E> a(amt<? extends jq<E>> $$0, Codec<E> $$1, boolean $$2) {
      return new amq($$0, $$1, $$2);
   }

   private amq(amt<? extends jq<E>> $$0, Codec<E> $$1, boolean $$2) {
      this.a = $$0;
      this.b = $$1;
      this.c = $$2;
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
            }, ($$2x) -> {
               return this.b.encode($$2x, $$1, $$2);
            });
         }
      }

      return this.b.encode($$0.a(), $$1, $$2);
   }

   public <T> DataResult<Pair<jd<E>, T>> decode(DynamicOps<T> $$0, T $$1) {
      if ($$0 instanceof ams) {
         ams<?> $$2 = (ams)$$0;
         Optional<je<E>> $$3 = $$2.b(this.a);
         if ($$3.isEmpty()) {
            return DataResult.error(() -> {
               return "Registry does not exist: " + String.valueOf(this.a);
            });
         } else {
            je<E> $$4 = (je)$$3.get();
            DataResult<Pair<amo, T>> $$5 = amo.a.decode($$0, $$1);
            if ($$5.result().isEmpty()) {
               return !this.c ? DataResult.error(() -> {
                  return "Inline definitions not allowed here";
               }) : this.b.decode($$0, $$1).map(($$0x) -> {
                  return $$0x.mapFirst(jd::a);
               });
            } else {
               Pair<amo, T> $$6 = (Pair)$$5.result().get();
               amt<E> $$7 = amt.a(this.a, (amo)$$6.getFirst());
               return ((DataResult)$$4.a($$7).map(DataResult::success).orElseGet(() -> {
                  return DataResult.error(() -> {
                     return "Failed to get element " + String.valueOf($$7);
                  });
               })).map(($$1x) -> {
                  return Pair.of($$1x, $$6.getSecond());
               }).setLifecycle(Lifecycle.stable());
            }
         }
      } else {
         return this.b.decode($$0, $$1).map(($$0x) -> {
            return $$0x.mapFirst(jd::a);
         });
      }
   }

   public String toString() {
      String var10000 = String.valueOf(this.a);
      return "RegistryFileCodec[" + var10000 + " " + String.valueOf(this.b) + "]";
   }

   // $FF: synthetic method
   public DataResult encode(final Object param1, final DynamicOps param2, final Object param3) {
      return this.a((jd)var1, var2, var3);
   }
}
