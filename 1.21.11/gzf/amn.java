import com.mojang.datafixers.util.Either;
import com.mojang.datafixers.util.Pair;
import com.mojang.serialization.Codec;
import com.mojang.serialization.DataResult;
import com.mojang.serialization.DynamicOps;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

public class amn<E> implements Codec<jh<E>> {
   private final amt<? extends jq<E>> a;
   private final Codec<jd<E>> b;
   private final Codec<List<jd<E>>> c;
   private final Codec<Either<bef<E>, List<jd<E>>>> d;

   private static <E> Codec<List<jd<E>>> a(Codec<jd<E>> $$0, boolean $$1) {
      Codec<List<jd<E>>> $$2 = $$0.listOf().validate(bfm.b(jd::f));
      return $$1 ? $$2 : bfm.c($$0, $$2);
   }

   public static <E> Codec<jh<E>> a(amt<? extends jq<E>> $$0, Codec<jd<E>> $$1, boolean $$2) {
      return new amn($$0, $$1, $$2);
   }

   private amn(amt<? extends jq<E>> $$0, Codec<jd<E>> $$1, boolean $$2) {
      this.a = $$0;
      this.b = $$1;
      this.c = a($$1, $$2);
      this.d = Codec.either(bef.b($$0), this.c);
   }

   public <T> DataResult<Pair<jh<E>, T>> decode(DynamicOps<T> $$0, T $$1) {
      if ($$0 instanceof ams) {
         ams<T> $$2 = (ams)$$0;
         Optional<je<E>> $$3 = $$2.b(this.a);
         if ($$3.isPresent()) {
            je<E> $$4 = (je)$$3.get();
            return this.d.decode($$0, $$1).flatMap(($$1x) -> {
               DataResult<jh<E>> $$2 = (DataResult)((Either)$$1x.getFirst()).map(($$1) -> {
                  return a($$4, $$1);
               }, ($$0) -> {
                  return DataResult.success(jh.a($$0));
               });
               return $$2.map(($$1) -> {
                  return Pair.of($$1, $$1x.getSecond());
               });
            });
         }
      }

      return this.a($$0, $$1);
   }

   private static <E> DataResult<jh<E>> a(je<E> $$0, bef<E> $$1) {
      return (DataResult)$$0.a($$1).map(DataResult::success).orElseGet(() -> {
         return DataResult.error(() -> {
            String var10000 = String.valueOf($$1.b());
            return "Missing tag: '" + var10000 + "' in '" + String.valueOf($$1.a().a()) + "'";
         });
      });
   }

   public <T> DataResult<T> a(jh<E> $$0, DynamicOps<T> $$1, T $$2) {
      if ($$1 instanceof ams) {
         ams<T> $$3 = (ams)$$1;
         Optional<jg<E>> $$4 = $$3.a(this.a);
         if ($$4.isPresent()) {
            if (!$$0.a((jg)$$4.get())) {
               return DataResult.error(() -> {
                  return "HolderSet " + String.valueOf($$0) + " is not valid in current registry set";
               });
            }

            return this.d.encode($$0.d().mapRight(List::copyOf), $$1, $$2);
         }
      }

      return this.b($$0, $$1, $$2);
   }

   private <T> DataResult<Pair<jh<E>, T>> a(DynamicOps<T> $$0, T $$1) {
      return this.b.listOf().decode($$0, $$1).flatMap(($$0x) -> {
         List<jd.a<E>> $$1 = new ArrayList();
         Iterator var2 = ((List)$$0x.getFirst()).iterator();

         while(var2.hasNext()) {
            jd<E> $$2 = (jd)var2.next();
            if (!($$2 instanceof jd.a)) {
               return DataResult.error(() -> {
                  return "Can't decode element " + String.valueOf($$2) + " without registry";
               });
            }

            jd.a<E> $$3 = (jd.a)$$2;
            $$1.add($$3);
         }

         return DataResult.success(new Pair(jh.a((List)$$1), $$0x.getSecond()));
      });
   }

   private <T> DataResult<T> b(jh<E> $$0, DynamicOps<T> $$1, T $$2) {
      return this.c.encode($$0.a().toList(), $$1, $$2);
   }

   // $FF: synthetic method
   public DataResult encode(final Object param1, final DynamicOps param2, final Object param3) {
      return this.a((jh)var1, var2, var3);
   }
}
