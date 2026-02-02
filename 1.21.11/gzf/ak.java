import com.mojang.serialization.Codec;
import com.mojang.serialization.MapCodec;

public record ak<T extends an>(am<T> b, T c) {
   private static final MapCodec<ak<?>> d;
   public static final Codec<ak<?>> a;

   public ak(am<T> param1, T param2) {
      this.b = $$0;
      this.c = $$1;
   }

   private static <T extends an> Codec<ak<T>> a(am<T> $$0) {
      return $$0.a().xmap(($$1) -> {
         return new ak($$0, $$1);
      }, ak::b);
   }

   public am<T> a() {
      return this.b;
   }

   public T b() {
      return this.c;
   }

   static {
      d = bfm.a("trigger", "conditions", aj.a, ak::a, ak::a);
      a = d.codec();
   }
}
