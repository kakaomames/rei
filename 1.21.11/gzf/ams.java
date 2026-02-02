import com.mojang.serialization.DataResult;
import com.mojang.serialization.Dynamic;
import com.mojang.serialization.DynamicOps;
import com.mojang.serialization.Lifecycle;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class ams<T> extends amk<T> {
   private final ams.c b;

   public static <T> ams<T> a(DynamicOps<T> $$0, jf.a $$1) {
      return a((DynamicOps)$$0, (ams.c)(new ams.a($$1)));
   }

   public static <T> ams<T> a(DynamicOps<T> $$0, ams.c $$1) {
      return new ams($$0, $$1);
   }

   public static <T> Dynamic<T> a(Dynamic<T> $$0, jf.a $$1) {
      return new Dynamic($$1.a($$0.getOps()), $$0.getValue());
   }

   private ams(DynamicOps<T> $$0, ams.c $$1) {
      super($$0);
      this.b = $$1;
   }

   public <U> ams<U> a(DynamicOps<U> $$0) {
      return $$0 == this.a ? this : new ams($$0, this.b);
   }

   public <E> Optional<jg<E>> a(amt<? extends jq<? extends E>> $$0) {
      return this.b.a($$0).map(ams.b::a);
   }

   public <E> Optional<je<E>> b(amt<? extends jq<? extends E>> $$0) {
      return this.b.a($$0).map(ams.b::b);
   }

   public boolean equals(Object $$0) {
      if (this == $$0) {
         return true;
      } else if ($$0 != null && this.getClass() == $$0.getClass()) {
         ams<?> $$1 = (ams)$$0;
         return this.a.equals($$1.a) && this.b.equals($$1.b);
      } else {
         return false;
      }
   }

   public int hashCode() {
      return this.a.hashCode() * 31 + this.b.hashCode();
   }

   public static <E, O> RecordCodecBuilder<O, je<E>> c(amt<? extends jq<? extends E>> $$0) {
      return bfm.a(($$1) -> {
         if ($$1 instanceof ams) {
            ams<?> $$2 = (ams)$$1;
            return (DataResult)$$2.b.a($$0).map(($$0x) -> {
               return DataResult.success($$0x.b(), $$0x.c());
            }).orElseGet(() -> {
               return DataResult.error(() -> {
                  return "Unknown registry: " + String.valueOf($$0);
               });
            });
         } else {
            return DataResult.error(() -> {
               return "Not a registry ops";
            });
         }
      }).forGetter(($$0x) -> {
         return null;
      });
   }

   public static <E, O> RecordCodecBuilder<O, jd.c<E>> d(amt<E> $$0) {
      amt<? extends jq<E>> $$1 = amt.a($$0.b());
      return bfm.a(($$2) -> {
         if ($$2 instanceof ams) {
            ams<?> $$3 = (ams)$$2;
            return (DataResult)$$3.b.a($$1).flatMap(($$1x) -> {
               return $$1x.b().a($$0);
            }).map(DataResult::success).orElseGet(() -> {
               return DataResult.error(() -> {
                  return "Can't find value: " + String.valueOf($$0);
               });
            });
         } else {
            return DataResult.error(() -> {
               return "Not a registry ops";
            });
         }
      }).forGetter(($$0x) -> {
         return null;
      });
   }

   static final class a implements ams.c {
      private final jf.a a;
      private final Map<amt<? extends jq<?>>, Optional<? extends ams.b<?>>> b = new ConcurrentHashMap();

      public a(jf.a $$0) {
         this.a = $$0;
      }

      public <E> Optional<ams.b<E>> a(amt<? extends jq<? extends E>> $$0) {
         return (Optional)this.b.computeIfAbsent($$0, this::b);
      }

      private Optional<ams.b<Object>> b(amt<? extends jq<?>> $$0) {
         return this.a.a($$0).map(ams.b::a);
      }

      public boolean equals(Object $$0) {
         if (this == $$0) {
            return true;
         } else {
            boolean var10000;
            if ($$0 instanceof ams.a) {
               ams.a $$1 = (ams.a)$$0;
               if (this.a.equals($$1.a)) {
                  var10000 = true;
                  return var10000;
               }
            }

            var10000 = false;
            return var10000;
         }
      }

      public int hashCode() {
         return this.a.hashCode();
      }
   }

   public interface c {
      <T> Optional<ams.b<T>> a(amt<? extends jq<? extends T>> var1);
   }

   public static record b<T>(jg<T> a, je<T> b, Lifecycle c) {
      public b(jg<T> param1, je<T> param2, Lifecycle param3) {
         this.a = $$0;
         this.b = $$1;
         this.c = $$2;
      }

      public static <T> ams.b<T> a(jf.b<T> $$0) {
         return new ams.b($$0, $$0, $$0.h());
      }

      public jg<T> a() {
         return this.a;
      }

      public je<T> b() {
         return this.b;
      }

      public Lifecycle c() {
         return this.c;
      }
   }
}
